import Student from '../models/Student.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';
import Placement from '../models/Placement.js';
import Notification from '../models/Notification.js';
import Certificate from '../models/Certificate.js';
import AptitudeModule from '../models/AptitudeModule.js';
import CommunicationModule from '../models/CommunicationModule.js';
import TechnicalModule from '../models/TechnicalModule.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceLog from '../models/AttendanceLog.js';
import jwt from 'jsonwebtoken';
import Enrollment from '../models/Enrollment.js';
import { calculateStudentScores, calculateAllRanks, calculatePlacementReadiness } from '../utils/calculations.js';

// @desc    Get student dashboard details
// @route   GET /api/student/dashboard
// @access  Private (Student only)
export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Fetch Profile
    let profile = await Student.findOne({ user: studentId })
      .populate('user', 'name email mobile role')
      .lean();
    if (!profile) {
      const userObj = await User.findById(studentId).select('name email mobile role').lean();
      profile = { user: userObj };
    }

    // 2. Fetch Placement Status
    const placement = await Placement.findOne({ student: studentId }) || {};

    // 3. Fetch Batch details from active Enrollments
    const enrollments = await Enrollment.find({ studentId, status: 'Active' })
      .populate({
        path: 'batchId',
        populate: { path: 'trainers', select: 'name email role mobile' }
      })
      .populate('trainerId', 'name email role mobile')
      .lean();

    const batches = enrollments.map(e => {
      const b = e.batchId || {};
      const trainersList = [];
      if (e.trainerId) {
        trainersList.push(e.trainerId);
      }
      if (b.trainers && b.trainers.length > 0) {
        b.trainers.forEach(tr => {
          if (!trainersList.some(t => t._id.toString() === tr._id.toString())) {
            trainersList.push(tr);
          }
        });
      }

      return {
        _id: b._id,
        name: b.name,
        course: b.course,
        startDate: b.startDate,
        endDate: b.endDate,
        trainers: trainersList
      };
    });
    
    const batch = batches[0] || null;

    if (profile && profile.user) {
      profile.user.technicalBatch = enrollments.filter(e => e.department === 'Technical').map(e => e.batchId?.name).filter(Boolean).join(', ');
      profile.user.technicalTrainer = enrollments.filter(e => e.department === 'Technical').map(e => e.trainerId?.name).filter(Boolean).join(', ');
      
      profile.user.communicationBatch = enrollments.filter(e => e.department === 'Communication').map(e => e.batchId?.name).filter(Boolean).join(', ');
      profile.user.communicationTrainer = enrollments.filter(e => e.department === 'Communication').map(e => e.trainerId?.name).filter(Boolean).join(', ');
      
      profile.user.aptitudeBatch = enrollments.filter(e => e.department === 'Aptitude').map(e => e.batchId?.name).filter(Boolean).join(', ');
      profile.user.aptitudeTrainer = enrollments.filter(e => e.department === 'Aptitude').map(e => e.trainerId?.name).filter(Boolean).join(', ');
    }

    // 4. Fetch Attendance stats
    const attendanceRecords = await Attendance.find({ student: studentId }).lean();
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    const today = new Date();
    const startOfToday = new Date(today.setHours(0,0,0,0));
    const endOfToday = new Date(today.setHours(23,59,59,999));
    const todayRecord = attendanceRecords.find(r => {
      const rDate = new Date(r.date);
      return rDate >= startOfToday && rDate <= endOfToday;
    });

    // Group attendance by month for graph
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAttendance = Array(12).fill(0).map((_, i) => ({ month: months[i], Present: 0, Absent: 0, Late: 0 }));
    attendanceRecords.forEach(rec => {
      if (rec.date) {
        const m = new Date(rec.date).getMonth();
        if (rec.status === 'Present') monthlyAttendance[m].Present += 1;
        if (rec.status === 'Absent') monthlyAttendance[m].Absent += 1;
        if (rec.status === 'Late') monthlyAttendance[m].Late += 1;
      }
    });

    // 5. Fetch Scores and Calculate Progress
    const scores = await Score.find({ student: studentId })
      .populate('updatedBy', 'name role')
      .lean();

    // Fetch master modules list to determine full list
    const aptMaster = await AptitudeModule.find({}).sort({ order: 1 }).lean();
    const commMaster = await CommunicationModule.find({}).sort({ order: 1 }).lean();
    const techMaster = await TechnicalModule.find({}).sort({ order: 1 }).lean();

    // Build lists with statuses, default to Not Started
    const buildScorecard = (masterList, scoreList, category) => {
      return masterList.map(item => {
        const studentScore = scoreList.find(s => s.moduleName === item.name && s.category === category);
        return {
          moduleName: item.name,
          status: studentScore ? studentScore.status : 'Not Started',
          marks: studentScore ? studentScore.marks : 0,
          remarks: studentScore ? studentScore.remarks : '',
          trainerName: studentScore && studentScore.updatedBy ? studentScore.updatedBy.name : 'N/A',
          updatedAt: studentScore ? studentScore.updatedAt : null
        };
      });
    };

    const aptitudeScorecard = buildScorecard(aptMaster, scores, 'Aptitude');
    const communicationScorecard = buildScorecard(commMaster, scores, 'Communication');
    const technicalScorecard = buildScorecard(techMaster, scores, 'Technical');

    // Calculate percentages
    const calcProgress = (scorecard) => {
      if (scorecard.length === 0) return 0;
      const completed = scorecard.filter(s => s.status === 'Completed').length;
      return Math.round((completed / scorecard.length) * 100);
    };

    const aptProgress = calcProgress(aptitudeScorecard);
    const commProgress = calcProgress(communicationScorecard);
    const techProgress = calcProgress(technicalScorecard);

    const totalModulesCount = aptMaster.length + commMaster.length + techMaster.length;
    const completedModulesCount = 
      aptitudeScorecard.filter(s => s.status === 'Completed').length +
      communicationScorecard.filter(s => s.status === 'Completed').length +
      technicalScorecard.filter(s => s.status === 'Completed').length;
    const overallProgress = totalModulesCount > 0 
      ? Math.round((completedModulesCount / totalModulesCount) * 100)
      : 0;

    // 6. Fetch Notifications
    const notifications = await Notification.find({ recipient: studentId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 7. Fetch Certificates
    const certificates = await Certificate.find({ student: studentId }).lean();

    // 8. Generate recommendations / timeline / upcoming classes mockup
    const upcomingClasses = [
      { id: 1, subject: 'Vedic Math Mock Test', time: '10:00 AM - 12:00 PM', date: 'Tomorrow', trainer: 'Aptitude Trainer' },
      { id: 2, subject: 'Group Discussion Practice', time: '02:00 PM - 04:00 PM', date: 'Weekly', trainer: 'Communication Trainer' },
      { id: 3, subject: 'React Context API & Projects', time: '09:00 AM - 11:00 AM', date: 'Next Monday', trainer: 'Technical Trainer' }
    ];

    // Compute grades, ranks and placement readiness metrics
    // Rank calculations are too slow for synchronous dashboard load with 100+ users.
    // Setting default to 0 to prevent Render API timeouts.
    const myRank = { instituteRank: 0, batchRank: 0 };
    const readiness = await calculatePlacementReadiness(studentId);
    const calculatedScores = await calculateStudentScores(studentId);

    res.json({
      profile,
      placement,
      batch: batch ? {
        _id: batch._id,
        name: batch.name,
        course: batch.course,
        startDate: batch.startDate,
        endDate: batch.endDate,
        trainers: batch.trainers
      } : null,
      batches: batches.map(b => ({
        _id: b._id,
        name: b.name,
        course: b.course,
        startDate: b.startDate,
        endDate: b.endDate,
        trainers: b.trainers
      })),
      attendance: {
        percentage: attendancePercent,
        totalClasses: totalDays,
        presentCount: presentDays,
        monthlyGraph: monthlyAttendance,
        todayRecord: todayRecord ? {
          status: todayRecord.status,
          time: todayRecord.createdAt
        } : null,
        records: attendanceRecords.map(rec => ({
          _id: rec._id,
          date: rec.date,
          status: rec.status,
          remarks: rec.remarks || ''
        })).sort((a, b) => new Date(b.date) - new Date(a.date))
      },
      scorecards: {
        aptitude: aptitudeScorecard,
        communication: communicationScorecard,
        technical: technicalScorecard
      },
      progress: {
        aptitude: aptProgress,
        communication: commProgress,
        technical: techProgress,
        overall: overallProgress
      },
      notifications,
      certificates,
      upcomingClasses,
      leaderboardRank: {
        institute: myRank.instituteRank || 0,
        batch: myRank.batchRank || 0
      },
      placementReadiness: readiness,
      calculatedScores: calculatedScores
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student profile details and uploads
// @route   PUT /api/student/profile
// @access  Private (Student only)
export const updateStudentProfile = async (req, res) => {
  const { 
    collegeName, degree, department, yearOfPassing, dob, gender, address, skills, linkedin, github, bio 
  } = req.body;

  try {
    const studentId = req.user._id;
    let profile = await Student.findOne({ user: studentId });

    if (!profile) {
      profile = new Student({ user: studentId });
    }

    // Map skills if string
    let skillsArray = profile.skills;
    if (skills) {
      skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    }

    // Handle files if uploaded
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        profile.photo = `/uploads/${req.files.photo[0].filename}`;
      }
      if (req.files.resume && req.files.resume[0]) {
        profile.resumeUrl = `/uploads/${req.files.resume[0].filename}`;
      }
    }

    // Update text fields
    profile.collegeName = collegeName || profile.collegeName;
    profile.degree = degree || profile.degree;
    profile.department = department || profile.department;
    profile.yearOfPassing = yearOfPassing || profile.yearOfPassing;
    profile.dob = dob ? new Date(dob) : profile.dob;
    profile.gender = gender || profile.gender;
    profile.address = address || profile.address;
    profile.skills = skillsArray;
    profile.linkedin = linkedin || profile.linkedin;
    profile.github = github || profile.github;
    profile.bio = bio || profile.bio;

    await profile.save();

    // Sync batch/trainer assignments to Enrollment collection
    const syncEnrollmentField = async (dept, batchNameString, trainerNameString) => {
      if (batchNameString === undefined) return;
      
      const batchNames = batchNameString.split(',').map(s => s.trim()).filter(Boolean);
      const trainerNames = trainerNameString ? trainerNameString.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      // Get all active enrollments for this department for the student
      const existingEnrollments = await Enrollment.find({ studentId, department: dept, status: 'Active' });
      const targetBatchIds = [];
      
      for (let i = 0; i < batchNames.length; i++) {
        const bName = batchNames[i];
        const tName = trainerNames[i] || trainerNames[0];
        
        let batch = await Batch.findOne({ name: bName });
        if (!batch) {
          batch = await Batch.create({
            name: bName,
            batchId: bName.toUpperCase().replace(/\s+/g, ''),
            course: dept === 'Technical' ? 'Technical Training' : dept === 'Communication' ? 'Communication Skills' : 'Aptitude & Reasoning',
            status: 'Active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          });
        }
        
        let trainer = null;
        if (tName) {
          trainer = await User.findOne({ name: tName, role: `${dept} Trainer` });
        }
        
        const enroll = await Enrollment.findOneAndUpdate(
          { studentId, batchId: batch._id, department: dept },
          {
            trainerId: trainer ? trainer._id : null,
            course: batch.course,
            status: 'Active'
          },
          { upsert: true, new: true }
        );
        
        targetBatchIds.push(batch._id.toString());
        
        if (!batch.students?.includes(studentId)) {
          await Batch.findByIdAndUpdate(batch._id, { $addToSet: { students: studentId } });
        }
      }
      
      // Mark legacy active enrollments not selected anymore as Completed
      for (const oldEnroll of existingEnrollments) {
        if (!targetBatchIds.includes(oldEnroll.batchId.toString())) {
          oldEnroll.status = 'Completed';
          oldEnroll.completedAt = new Date();
          await oldEnroll.save();
          
          await Batch.findByIdAndUpdate(oldEnroll.batchId, { $pull: { students: studentId } });
        }
      }
    };

    await syncEnrollmentField('Technical', req.body.technicalBatch, req.body.technicalTrainer);
    await syncEnrollmentField('Communication', req.body.communicationBatch, req.body.communicationTrainer);
    await syncEnrollmentField('Aptitude', req.body.aptitudeBatch, req.body.aptitudeTrainer);

    // Check if profile is complete to clear "profile is incomplete" alert
    if (profile.collegeName && profile.degree && profile.photo && profile.resumeUrl) {
      // Check if alert notification exists and delete it, or mark notifications
      await Notification.deleteMany({ recipient: studentId, title: 'Profile Incomplete' });
    }

    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Claim / Generate Course Certificate
// @route   POST /api/student/certificate
// @access  Private (Student only)
export const claimCertificate = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Check overall progress
    const scores = await Score.find({ student: studentId }).lean();
    const aptMaster = await AptitudeModule.countDocuments();
    const commMaster = await CommunicationModule.countDocuments();
    const techMaster = await TechnicalModule.countDocuments();

    const totalModules = aptMaster + commMaster + techMaster;
    const completedModules = scores.filter(s => s.status === 'Completed').length;

    const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    if (progress < 80) {
      return res.status(400).json({ 
        message: `Overall progress must be at least 80% to claim certificate. Current: ${progress}%` 
      });
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ student: studentId });
    if (existingCert) {
      return res.status(400).json({ message: 'Certificate already issued for this course' });
    }

    const batch = await Batch.findOne({ students: studentId });
    const courseName = batch ? batch.course : 'Full Stack Training & Career Placement Programme';

    // Mock URL for certificate download
    const certificateUrl = `/uploads/certificate_${studentId}.pdf`;

    const certificate = await Certificate.create({
      student: studentId,
      courseName,
      certificateUrl
    });

    await Notification.create({
      recipient: studentId,
      title: 'Certificate Issued!',
      message: `Congratulations! Your certificate for "${courseName}" has been successfully generated.`
    });

    res.status(201).json({ message: 'Certificate generated successfully', certificate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all student notifications
// @route   GET /api/student/notifications
// @access  Private (Student only)
export const getNotifications = async (req, res) => {
  try {
    const list = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/student/notifications/read
// @access  Private (Student only)
export const markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Scan QR and mark attendance
// @route   POST /api/student/attendance/scan
// @access  Private (Student only)
export const scanQR = async (req, res) => {
  const { token } = req.body;
  const studentId = req.user._id;

  try {
    if (!token) {
      return res.status(400).json({ message: 'QR Token is required' });
    }

    // 1. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'lcp_secret_key_123456');
    } catch (err) {
      // Log failure in immutable logs
      await AttendanceLog.create({
        student: studentId,
        scannedToken: token,
        status: 'Failed',
        reason: 'Expired or Invalid QR Code',
        ipAddress: req.ip || ''
      });
      return res.status(400).json({ message: 'QR Code is expired or invalid' });
    }

    // 2. Check if student is active
    if (req.user.status === 'Inactive') {
      await AttendanceLog.create({
        student: studentId,
        scannedToken: token,
        status: 'Failed',
        reason: 'Student account is inactive',
        ipAddress: req.ip || ''
      });
      return res.status(403).json({ message: 'Your account is deactivated' });
    }

    // 3. Find Class Session
    const session = await AttendanceSession.findById(decoded.sessionId);
    if (!session || !session.isActive) {
      await AttendanceLog.create({
        student: studentId,
        scannedToken: token,
        status: 'Failed',
        reason: 'Class session is closed or inactive',
        ipAddress: req.ip || ''
      });
      return res.status(400).json({ message: 'Class session is no longer active' });
    }

    // 4. Verify student is enrolled in the session's batch
    const batch = await Batch.findById(session.batch);
    if (!batch) {
      return res.status(400).json({ message: 'Batch not found' });
    }
    const isEnrolled = batch.students.some(id => id.toString() === studentId.toString());
    if (!isEnrolled) {
      await AttendanceLog.create({
        student: studentId,
        session: session._id,
        scannedToken: token,
        status: 'Failed',
        reason: 'Student not enrolled in batch',
        ipAddress: req.ip || ''
      });
      return res.status(400).json({ message: 'You are not registered in this batch' });
    }

    // 5. Verify student has not marked attendance for this session already
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      $or: [
        { session: session._id },
        { batch: session.batch, date: {
          $gte: new Date(new Date(session.startTime).setHours(0,0,0,0)),
          $lt: new Date(new Date(session.startTime).setHours(23,59,59,999))
        } }
      ]
    });

    if (existingAttendance) {
      await AttendanceLog.create({
        student: studentId,
        session: session._id,
        scannedToken: token,
        status: 'Failed',
        reason: 'Duplicate scan / Attendance already marked',
        ipAddress: req.ip || ''
      });
      return res.status(400).json({ message: 'You have already marked attendance for this class/day' });
    }

    /*
    // 5.5 IP Address Subnet Verification (Anti-Spoofing classroom check)
    const studentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
    const trainerIp = session.ipAddress || '';

    const cleanIP = (ip) => {
      if (!ip) return '';
      if (ip.includes('::ffff:')) {
        return ip.split('::ffff:')[1];
      }
      if (ip === '::1') return '127.0.0.1';
      return ip.trim();
    };

    const cleanStudent = cleanIP(studentIp);
    const cleanTrainer = cleanIP(trainerIp);

    const getSubnet = (ip) => {
      const parts = ip.split('.');
      if (parts.length >= 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
      return ip;
    };

    const studentSubnet = getSubnet(cleanStudent);
    const trainerSubnet = getSubnet(cleanTrainer);

    if (cleanStudent && cleanTrainer && cleanStudent !== cleanTrainer && studentSubnet !== trainerSubnet) {
      await AttendanceLog.create({
        student: studentId,
        session: session._id,
        scannedToken: token,
        status: 'Failed',
        reason: `IP mismatch: Student IP ${cleanStudent} does not match classroom Wi-Fi network ${cleanTrainer}`,
        ipAddress: cleanStudent
      });
      return res.status(403).json({ 
        message: `Attendance failed: You must be connected to the classroom Wi-Fi network to mark attendance. (Your IP: ${cleanStudent}, Classroom IP: ${cleanTrainer})` 
      });
    }
    */

    // 6. Compute Late Logic
    const scanTime = new Date();
    const sessionStartTime = new Date(session.startTime);
    const diffMs = scanTime - sessionStartTime;
    const diffMinutes = Math.floor(diffMs / 60000);

    let status = 'Present';
    if (diffMinutes > 10 && diffMinutes <= 20) {
      status = 'Late';
    } else if (diffMinutes > 20) {
      status = 'Absent';
    }

    // 7. Save Attendance record
    const attendance = await Attendance.create({
      student: studentId,
      batch: session.batch,
      date: session.startTime,
      status,
      session: session._id,
      markedBy: session.trainer
    });

    // 8. Save Immutable log
    await AttendanceLog.create({
      student: studentId,
      session: session._id,
      scannedToken: token,
      status: 'Success',
      reason: `Marked successfully as ${status}`,
      ipAddress: req.ip || ''
    });

    // 9. Notify student
    await Notification.create({
      recipient: studentId,
      title: 'Attendance Marked Successfully',
      message: `You were marked as ${status} in ${session.subject} (Room: ${session.roomNumber}, Floor: ${session.floorNumber})`
    });

    res.status(201).json({ message: `Attendance marked successfully as ${status}`, attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Leaderboard Ranks
// @route   GET /api/student/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const ranks = await calculateAllRanks();
    res.json(ranks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student AI roadmap
// @route   GET /api/student/ai-roadmap
// @access  Private (Student only)
export const getStudentAIRoadmap = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    res.json(student.aiRoadmap || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate a new customized AI roadmap
// @route   POST /api/student/ai-roadmap
// @access  Private (Student only)
export const generateStudentAIRoadmap = async (req, res) => {
  const { targetTrack, familiarSkills, dailyHours } = req.body;

  if (!targetTrack || !dailyHours) {
    return res.status(400).json({ message: 'Target track and daily study hours are required' });
  }

  const hoursNum = Number(dailyHours);
  if (hoursNum < 1 || hoursNum > 10) {
    return res.status(400).json({ message: 'Daily hours must be between 1 and 10' });
  }

  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const templates = {
      'MERN Full Stack Developer': [
        { name: 'HTML5 & CSS3 Essentials', hours: 20, subtopics: ['Semantic Tags', 'CSS Grid & Flexbox', 'Responsive Design', 'Tailwind CSS'] },
        { name: 'Advanced JavaScript & ES6', hours: 30, subtopics: ['Closures & Scope', 'Promises & Async/Await', 'DOM Manipulation', 'ES6 Modules'] },
        { name: 'React Frontend Architecture', hours: 40, subtopics: ['Component Lifecycle', 'State Management (Hooks)', 'React Router', 'API Integration (Axios)'] },
        { name: 'Node.js & Express API Development', hours: 35, subtopics: ['HTTP Server Basics', 'Routing & Middleware', 'REST API Design', 'JWT Authentication'] },
        { name: 'MongoDB Database Design', hours: 25, subtopics: ['Mongoose Schemas', 'CRUD Operations', 'Aggregation Pipeline', 'Database Security'] },
        { name: 'System Integration & Git/CI-CD', hours: 20, subtopics: ['Git Version Control', 'Heroku/Vercel Deployment', 'Docker Basics', 'Testing with Jest'] }
      ],
      'Python Data Scientist': [
        { name: 'Python Core & Scripting', hours: 25, subtopics: ['Data Types & Structures', 'Functions & OOP', 'File Handling & APIs', 'Jupyter Notebooks'] },
        { name: 'Data Analysis with Pandas & NumPy', hours: 35, subtopics: ['NumPy Arrays', 'Pandas DataFrames', 'Data Cleaning & Wrangling', 'Handling Missing Data'] },
        { name: 'Data Visualization', hours: 20, subtopics: ['Matplotlib Basics', 'Seaborn Advanced Charts', 'Interactive Plots (Plotly)', 'Storytelling with Data'] },
        { name: 'SQL & Database Querying', hours: 25, subtopics: ['Relational DB Basics', 'SELECT Queries & Joins', 'Aggregations & Grouping', 'NoSQL Basics'] },
        { name: 'Introduction to Machine Learning', hours: 45, subtopics: ['Supervised Learning', 'Unsupervised Clustering', 'Model Evaluation & Tuning', 'Scikit-Learn library'] },
        { name: 'Feature Engineering & Capstone Project', hours: 30, subtopics: ['Scaling & Encoding', 'Dimensionality Reduction', 'End-to-End Pipeline', 'Git & Model Deployment'] }
      ],
      'Java Backend Developer': [
        { name: 'Java OOP Core Concepts', hours: 30, subtopics: ['Classes & Objects', 'Inheritance & Polymorphism', 'Interfaces & Abstraction', 'Exception Handling'] },
        { name: 'Java Collections & Streams', hours: 25, subtopics: ['Lists, Sets & Maps', 'Lambda Expressions', 'Stream API', 'Generics & Threading'] },
        { name: 'Spring Boot Basics', hours: 40, subtopics: ['Dependency Injection', 'Spring MVC Controllers', 'Spring Boot Configuration', 'REST API endpoints'] },
        { name: 'Hibernate & JPA Database Integration', hours: 30, subtopics: ['Entity Mapping', 'Spring Data JPA repositories', 'JPQL Queries', 'Transactions'] },
        { name: 'Security & RESTful API Best Practices', hours: 35, subtopics: ['Spring Security', 'JWT Auth in Spring', 'API Documentation (Swagger)', 'Logging & Monitoring'] },
        { name: 'Testing & Microservices Intro', hours: 30, subtopics: ['JUnit & Mockito', 'Dockerizing Spring Apps', 'Config Server / Service Discovery', 'Eureka & Gateway'] }
      ],
      'UI/UX Designer': [
        { name: 'Design Thinking & UX Principles', hours: 20, subtopics: ['User-Centered Design', 'Information Architecture', 'Heuristic Evaluation', 'User Personas'] },
        { name: 'Wireframing & Prototyping in Figma', hours: 35, subtopics: ['Figma Tools & Layouts', 'Auto Layout & Components', 'Interactive Prototyping', 'User Flows'] },
        { name: 'Visual Design & Typography', hours: 25, subtopics: ['Color Theory', 'Grid Systems', 'Typography Hierarchy', 'Accessibility (WCAG)'] },
        { name: 'User Research & Usability Testing', hours: 25, subtopics: ['User Interviews', 'A/B Testing', 'Heatmaps & Analytics', 'Cognitive Walkthrough'] },
        { name: 'Creating Design Systems', hours: 30, subtopics: ['Design Tokens', 'Reusable Figma Components', 'Component States', 'Developer Handoff'] },
        { name: 'Portfolio Development & Presentation', hours: 25, subtopics: ['Case Study Writing', 'Portfolio Website Design', 'Mockups & Visual Presentation', 'UX Interview prep'] }
      ]
    };

    const trackTemplate = templates[targetTrack] || templates['MERN Full Stack Developer'];
    const skillsArray = Array.isArray(familiarSkills) 
      ? familiarSkills.map(s => s.trim().toLowerCase()) 
      : typeof familiarSkills === 'string'
        ? familiarSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : [];

    const generatedTopics = trackTemplate.map(topic => {
      // Check if user is familiar with subtopics
      let matchingCount = 0;
      topic.subtopics.forEach(sub => {
        const subLow = sub.toLowerCase();
        const hasSkillMatch = skillsArray.some(skill => subLow.includes(skill) || skill.includes(subLow));
        if (hasSkillMatch) {
          matchingCount++;
        }
      });

      // Reduce hours if user knows some of the subtopics
      const skillReductionFactor = topic.subtopics.length > 0 ? (matchingCount / topic.subtopics.length) : 0;
      const adjustedHours = Math.max(5, topic.hours * (1 - (skillReductionFactor * 0.6))); // Maximum 60% reduction
      const estimatedDays = Math.max(1, Math.round(adjustedHours / hoursNum));

      return {
        name: topic.name,
        subtopics: topic.subtopics,
        estimatedDays,
        completed: skillReductionFactor === 1 // Mark completed if they know all subtopics
      };
    });

    student.aiRoadmap = {
      targetTrack,
      familiarSkills: skillsArray,
      dailyHours: hoursNum,
      topics: generatedTopics,
      generatedAt: new Date()
    };

    await student.save();
    res.json(student.aiRoadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle completion of a roadmap topic
// @route   PUT /api/student/ai-roadmap/toggle-topic
// @access  Private (Student only)
export const toggleAIRoadmapTopic = async (req, res) => {
  const { topicId } = req.body;
  if (!topicId) {
    return res.status(400).json({ message: 'Topic ID is required' });
  }

  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student || !student.aiRoadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }

    const topicIndex = student.aiRoadmap.topics.findIndex(t => t._id.toString() === topicId);
    if (topicIndex === -1) {
      return res.status(404).json({ message: 'Topic not found in roadmap' });
    }

    // Toggle completed status
    student.aiRoadmap.topics[topicIndex].completed = !student.aiRoadmap.topics[topicIndex].completed;

    // Use markModified because we are modifying nested fields in subdocuments
    student.markModified('aiRoadmap');
    await student.save();

    res.json(student.aiRoadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate a new customized AI roadmap for a student (Admin/Trainer view)
// @route   POST /api/admin/students/:userId/ai-roadmap
// @access  Private (Admin/Super Admin/Trainer only)
export const generateStudentAIRoadmapForAdmin = async (req, res) => {
  const { userId } = req.params;
  const { targetTrack, familiarSkills, dailyHours } = req.body;

  if (!targetTrack || !dailyHours) {
    return res.status(400).json({ message: 'Target track and daily study hours are required' });
  }

  const hoursNum = Number(dailyHours);
  if (hoursNum < 1 || hoursNum > 10) {
    return res.status(400).json({ message: 'Daily hours must be between 1 and 10' });
  }

  try {
    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const templates = {
      'MERN Full Stack Developer': [
        { name: 'HTML5 & CSS3 Essentials', hours: 20, subtopics: ['Semantic Tags', 'CSS Grid & Flexbox', 'Responsive Design', 'Tailwind CSS'] },
        { name: 'Advanced JavaScript & ES6', hours: 30, subtopics: ['Closures & Scope', 'Promises & Async/Await', 'DOM Manipulation', 'ES6 Modules'] },
        { name: 'React Frontend Architecture', hours: 40, subtopics: ['Component Lifecycle', 'State Management (Hooks)', 'React Router', 'API Integration (Axios)'] },
        { name: 'Node.js & Express API Development', hours: 35, subtopics: ['HTTP Server Basics', 'Routing & Middleware', 'REST API Design', 'JWT Authentication'] },
        { name: 'MongoDB Database Design', hours: 25, subtopics: ['Mongoose Schemas', 'CRUD Operations', 'Aggregation Pipeline', 'Database Security'] },
        { name: 'System Integration & Git/CI-CD', hours: 20, subtopics: ['Git Version Control', 'Heroku/Vercel Deployment', 'Docker Basics', 'Testing with Jest'] }
      ],
      'Python Data Scientist': [
        { name: 'Python Core & Scripting', hours: 25, subtopics: ['Data Types & Structures', 'Functions & OOP', 'File Handling & APIs', 'Jupyter Notebooks'] },
        { name: 'Data Analysis with Pandas & NumPy', hours: 35, subtopics: ['NumPy Arrays', 'Pandas DataFrames', 'Data Cleaning & Wrangling', 'Handling Missing Data'] },
        { name: 'Data Visualization', hours: 20, subtopics: ['Matplotlib Basics', 'Seaborn Advanced Charts', 'Interactive Plots (Plotly)', 'Storytelling with Data'] },
        { name: 'SQL & Database Querying', hours: 25, subtopics: ['Relational DB Basics', 'SELECT Queries & Joins', 'Aggregations & Grouping', 'NoSQL Basics'] },
        { name: 'Introduction to Machine Learning', hours: 45, subtopics: ['Supervised Learning', 'Unsupervised Clustering', 'Model Evaluation & Tuning', 'Scikit-Learn library'] },
        { name: 'Feature Engineering & Capstone Project', hours: 30, subtopics: ['Scaling & Encoding', 'Dimensionality Reduction', 'End-to-End Pipeline', 'Git & Model Deployment'] }
      ],
      'Java Backend Developer': [
        { name: 'Java OOP Core Concepts', hours: 30, subtopics: ['Classes & Objects', 'Inheritance & Polymorphism', 'Interfaces & Abstraction', 'Exception Handling'] },
        { name: 'Java Collections & Streams', hours: 25, subtopics: ['Lists, Sets & Maps', 'Lambda Expressions', 'Stream API', 'Generics & Threading'] },
        { name: 'Spring Boot Basics', hours: 40, subtopics: ['Dependency Injection', 'Spring MVC Controllers', 'Spring Boot Configuration', 'REST API endpoints'] },
        { name: 'Hibernate & JPA Database Integration', hours: 30, subtopics: ['Entity Mapping', 'Spring Data JPA repositories', 'JPQL Queries', 'Transactions'] },
        { name: 'Security & RESTful API Best Practices', hours: 35, subtopics: ['Spring Security', 'JWT Auth in Spring', 'API Documentation (Swagger)', 'Logging & Monitoring'] },
        { name: 'Testing & Microservices Intro', hours: 30, subtopics: ['JUnit & Mockito', 'Dockerizing Spring Apps', 'Config Server / Service Discovery', 'Eureka & Gateway'] }
      ],
      'UI/UX Designer': [
        { name: 'Design Thinking & UX Principles', hours: 20, subtopics: ['User-Centered Design', 'Information Architecture', 'Heuristic Evaluation', 'User Personas'] },
        { name: 'Wireframing & Prototyping in Figma', hours: 35, subtopics: ['Figma Tools & Layouts', 'Auto Layout & Components', 'Interactive Prototyping', 'User Flows'] },
        { name: 'Visual Design & Typography', hours: 25, subtopics: ['Color Theory', 'Grid Systems', 'Typography Hierarchy', 'Accessibility (WCAG)'] },
        { name: 'User Research & Usability Testing', hours: 25, subtopics: ['User Interviews', 'A/B Testing', 'Heatmaps & Analytics', 'Cognitive Walkthrough'] },
        { name: 'Creating Design Systems', hours: 30, subtopics: ['Design Tokens', 'Reusable Figma Components', 'Component States', 'Developer Handoff'] },
        { name: 'Portfolio Development & Presentation', hours: 25, subtopics: ['Case Study Writing', 'Portfolio Website Design', 'Mockups & Visual Presentation', 'UX Interview prep'] }
      ]
    };

    const trackTemplate = templates[targetTrack] || templates['MERN Full Stack Developer'];
    const skillsArray = Array.isArray(familiarSkills) 
      ? familiarSkills.map(s => s.trim().toLowerCase()) 
      : typeof familiarSkills === 'string'
        ? familiarSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : [];

    const generatedTopics = trackTemplate.map(topic => {
      let matchingCount = 0;
      topic.subtopics.forEach(sub => {
        const subLow = sub.toLowerCase();
        const hasSkillMatch = skillsArray.some(skill => subLow.includes(skill) || skill.includes(subLow));
        if (hasSkillMatch) {
          matchingCount++;
        }
      });

      const skillReductionFactor = topic.subtopics.length > 0 ? (matchingCount / topic.subtopics.length) : 0;
      const adjustedHours = Math.max(5, topic.hours * (1 - (skillReductionFactor * 0.6)));
      const estimatedDays = Math.max(1, Math.round(adjustedHours / hoursNum));

      return {
        name: topic.name,
        subtopics: topic.subtopics,
        estimatedDays,
        completed: skillReductionFactor === 1
      };
    });

    student.aiRoadmap = {
      targetTrack,
      familiarSkills: skillsArray,
      dailyHours: hoursNum,
      topics: generatedTopics,
      generatedAt: new Date()
    };

    await student.save();
    res.json(student.aiRoadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active batches for selection
// @route   GET /api/student/batches
// @access  Private (Student only)
export const getAvailableBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ status: 'Active' })
      .populate('trainers', 'name role')
      .lean();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all trainers for selection
// @route   GET /api/student/trainers
// @access  Private (Student only)
export const getAvailableTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ 
      role: { $in: ['Technical Trainer', 'Communication Trainer', 'Aptitude Trainer'] } 
    }).select('name role email').lean();
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
