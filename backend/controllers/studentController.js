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
import { calculateStudentScores, calculateAllRanks, calculatePlacementReadiness } from '../utils/calculations.js';

// @desc    Get student dashboard details
// @route   GET /api/student/dashboard
// @access  Private (Student only)
export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Fetch Profile
    const profile = await Student.findOne({ user: studentId }) || {};

    // 2. Fetch Placement Status
    const placement = await Placement.findOne({ student: studentId }) || {};

    // 3. Fetch Batch details
    const batch = await Batch.findOne({ students: studentId })
      .populate('trainers', 'name email role mobile')
      .lean();

    // 4. Fetch Attendance stats
    const attendanceRecords = await Attendance.find({ student: studentId }).lean();
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

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
    const rankDetails = await calculateAllRanks();
    const myRank = rankDetails.find(r => r.studentId === studentId.toString()) || { instituteRank: 0, batchRank: 0 };
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
      attendance: {
        percentage: attendancePercent,
        totalClasses: totalDays,
        presentCount: presentDays,
        monthlyGraph: monthlyAttendance
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
