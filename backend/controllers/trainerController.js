import mongoose from 'mongoose';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import AttendanceSession from '../models/AttendanceSession.js';
import jwt from 'jsonwebtoken';
import { syncStudentTrainers, syncStudentBatchesFromStrings } from '../utils/trainerMapper.js';
import Enrollment from '../models/Enrollment.js';
import fs from 'fs';
import * as xlsx from 'xlsx';
import Placement from '../models/Placement.js';

// Helper to map trainer role to score category
const getCategoryByRole = (role) => {
  if (role === 'Aptitude Trainer') return 'Aptitude';
  if (role === 'Communication Trainer') return 'Communication';
  if (role === 'Technical Trainer') return 'Technical';
  if (role === 'Admin' || role === 'Super Admin') return 'Admin';
  return 'General';
};

// @desc    Get all students in batches assigned to this trainer
// @route   GET /api/trainer/students
// @access  Private (Trainer only)
export const getAssignedStudents = async (req, res) => {
  try {
    const category = getCategoryByRole(req.user.role);
    if (!category) {
      return res.status(403).json({ message: 'User is not a valid trainer' });
    }

    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    const batchQuery = isAdmin ? {} : { trainers: req.user._id };

    // Find batches where this trainer is assigned (or all batches for admin)
    const batches = await Batch.find(batchQuery)
      .populate('students', 'name email mobile status slaeId technicalTrainer communicationTrainer aptitudeTrainer technicalBatch communicationBatch aptitudeBatch')
      .lean();

    // Fetch all batches in the database populated with trainers to resolve trainer names dynamically
    const allBatches = await Batch.find()
      .populate('trainers', 'name role')
      .lean();

    const batchTrainerMap = {};
    for (const b of allBatches) {
      let trainerObj = null;
      if (b.course === 'Technical Training') {
        trainerObj = b.trainers?.find(t => t.role === 'Technical Trainer') || b.trainers?.[0];
      } else if (b.course === 'Communication Skills') {
        trainerObj = b.trainers?.find(t => t.role === 'Communication Trainer') || b.trainers?.[0];
      } else if (b.course === 'Aptitude & Reasoning') {
        trainerObj = b.trainers?.find(t => t.role === 'Aptitude Trainer') || b.trainers?.[0];
      }
      if (trainerObj) {
        batchTrainerMap[b._id.toString()] = trainerObj.name;
        batchTrainerMap[b.name.trim().toLowerCase()] = trainerObj.name;
      }
    }

    let allStudentUsers = [];
    if (isAdmin) {
      allStudentUsers = await User.find({ role: 'Student' })
        .select('name email mobile status slaeId')
        .lean();
    } else {
      // Get unique students that this trainer actually teaches
      const batchStudentIds = batches.flatMap(b => b.students?.map(s => s._id?.toString() || s.toString()) || []);
      
      // Also find students who are enrolled directly with this trainer
      const directEnrollments = await Enrollment.find({ trainerId: req.user._id, status: 'Active' }).lean();
      const enrolledStudentIds = directEnrollments.map(e => e.studentId.toString());
      
      const uniqueStudentIds = [...new Set([...batchStudentIds, ...enrolledStudentIds])];

      allStudentUsers = await User.find({ _id: { $in: uniqueStudentIds }, role: 'Student' })
        .select('name email mobile status slaeId')
        .lean();
    }

    const allStudentIds = allStudentUsers.map(s => s._id);

    // Fetch active enrollments for these students
    const enrollments = await Enrollment.find({ studentId: { $in: allStudentIds }, status: 'Active' })
      .populate('batchId', 'name')
      .populate('trainerId', 'name')
      .lean();

    const studentMap = {};

    for (const std of allStudentUsers) {
      const studentEnrolls = enrollments.filter(e => e.studentId.toString() === std._id.toString());
      
      const technicalBatch = studentEnrolls.filter(e => e.department === 'Technical').map(e => e.batchId?.name).filter(Boolean).join(', ');
      const technicalTrainer = studentEnrolls.filter(e => e.department === 'Technical').map(e => e.trainerId?.name).filter(Boolean).join(', ');
      
      const communicationBatch = studentEnrolls.filter(e => e.department === 'Communication').map(e => e.batchId?.name).filter(Boolean).join(', ');
      const communicationTrainer = studentEnrolls.filter(e => e.department === 'Communication').map(e => e.trainerId?.name).filter(Boolean).join(', ');
      
      const aptitudeBatch = studentEnrolls.filter(e => e.department === 'Aptitude').map(e => e.batchId?.name).filter(Boolean).join(', ');
      const aptitudeTrainer = studentEnrolls.filter(e => e.department === 'Aptitude').map(e => e.trainerId?.name).filter(Boolean).join(', ');

      studentMap[std._id] = {
        _id: std._id,
        slaeId: std.slaeId || `SLA-${std._id.toString().slice(-5).toUpperCase()}`,
        name: std.name,
        email: std.email,
        mobile: std.mobile || 'N/A',
        status: std.status || 'Active',
        technicalTrainer,
        communicationTrainer,
        aptitudeTrainer,
        technicalBatch,
        communicationBatch,
        aptitudeBatch,
        batches: []
      };
    }

    for (const batch of batches) {
      for (const std of batch.students) {
        if (!studentMap[std._id]) {
          const studentEnrolls = enrollments.filter(e => e.studentId.toString() === std._id.toString());
          const technicalBatch = studentEnrolls.filter(e => e.department === 'Technical').map(e => e.batchId?.name).filter(Boolean).join(', ');
          const technicalTrainer = studentEnrolls.filter(e => e.department === 'Technical').map(e => e.trainerId?.name).filter(Boolean).join(', ');
          const communicationBatch = studentEnrolls.filter(e => e.department === 'Communication').map(e => e.batchId?.name).filter(Boolean).join(', ');
          const communicationTrainer = studentEnrolls.filter(e => e.department === 'Communication').map(e => e.trainerId?.name).filter(Boolean).join(', ');
          const aptitudeBatch = studentEnrolls.filter(e => e.department === 'Aptitude').map(e => e.batchId?.name).filter(Boolean).join(', ');
          const aptitudeTrainer = studentEnrolls.filter(e => e.department === 'Aptitude').map(e => e.trainerId?.name).filter(Boolean).join(', ');

          studentMap[std._id] = {
            _id: std._id,
            slaeId: std.slaeId || `SLA-${std._id.toString().slice(-5).toUpperCase()}`,
            name: std.name,
            email: std.email,
            mobile: std.mobile || 'N/A',
            status: std.status || 'Active',
            technicalTrainer,
            communicationTrainer,
            aptitudeTrainer,
            technicalBatch,
            communicationBatch,
            aptitudeBatch,
            batches: [{ _id: batch._id, name: batch.name, course: batch.course }]
          };
        } else {
          if (!studentMap[std._id].batches.some(b => String(b._id) === String(batch._id))) {
            studentMap[std._id].batches.push({ _id: batch._id, name: batch.name, course: batch.course });
          }
        }
      }
    }

    const studentIds = Object.keys(studentMap);
    
    // Fetch profiles, scores, and attendance counts
    const profiles = await Student.find({ user: { $in: studentIds } }).lean();
    const scores = await Score.find({ student: { $in: studentIds }, category }).lean();
    const attendanceLogs = await Attendance.find({ student: { $in: studentIds } }).lean();
    
    const studentsList = studentIds.map(id => {
      const studentData = studentMap[id];
      
      let resolvedTechnicalTrainer = studentData.technicalTrainer || '';
      if (!resolvedTechnicalTrainer && studentData.technicalBatch && batchTrainerMap[studentData.technicalBatch.trim().toLowerCase()]) {
        resolvedTechnicalTrainer = batchTrainerMap[studentData.technicalBatch.trim().toLowerCase()];
      }

      let resolvedCommunicationTrainer = studentData.communicationTrainer || '';
      if (!resolvedCommunicationTrainer && studentData.communicationBatch && batchTrainerMap[studentData.communicationBatch.trim().toLowerCase()]) {
        resolvedCommunicationTrainer = batchTrainerMap[studentData.communicationBatch.trim().toLowerCase()];
      }

      let resolvedAptitudeTrainer = studentData.aptitudeTrainer || '';
      if (!resolvedAptitudeTrainer && studentData.aptitudeBatch && batchTrainerMap[studentData.aptitudeBatch.trim().toLowerCase()]) {
        resolvedAptitudeTrainer = batchTrainerMap[studentData.aptitudeBatch.trim().toLowerCase()];
      }

      const profile = profiles.find(p => p.user.toString() === id.toString()) || {};
      const studentScores = scores.filter(s => s.student.toString() === id.toString());
      
      const stuLogs = attendanceLogs.filter(a => a.student?.toString() === id.toString());
      const totalDays = stuLogs.length;
      const presentDays = stuLogs.filter(a => a.status === 'Present' || a.status === 'Late').length;
      const calcAttendancePct = totalDays > 0 
        ? Math.round((presentDays / totalDays) * 100) 
        : (profile.attendance !== undefined ? Number(profile.attendance) : 85);

      // Calculate overall progress in trainer's category
      let totalModules = 16; // Aptitude
      if (category === 'Communication') totalModules = 11;
      if (category === 'Technical') totalModules = 14;

      const completedCount = studentScores.filter(s => s.status === 'Completed').length;
      const progressPercent = Math.round((completedCount / totalModules) * 100);

      return {
        ...studentData,
        technicalTrainer: resolvedTechnicalTrainer,
        communicationTrainer: resolvedCommunicationTrainer,
        aptitudeTrainer: resolvedAptitudeTrainer,
        profile,
        attendancePct: calcAttendancePct,
        progress: progressPercent,
        scores: studentScores,
      };
    });

    res.json(studentsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit attendance for a batch on a date
// @route   POST /api/trainer/attendance
// @access  Private (Trainer/Admin)
export const markAttendance = async (req, res) => {
  const { batchId, date, records } = req.body; // records: [{ studentId, status: 'Present'|'Absent'|'Late' }]

  try {
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid attendance submit details' });
    }

    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0); // normalize date

    const savedRecords = [];

    for (const rec of records) {
      let effectiveBatchId = batchId;
      if (!effectiveBatchId || effectiveBatchId === 'all' || !mongoose.Types.ObjectId.isValid(effectiveBatchId)) {
        const stu = await User.findById(rec.studentId);
        let foundBatchId = null;
        if (!foundBatchId) {
          const enroll = await Enrollment.findOne({ studentId: rec.studentId, status: 'Active' });
          if (enroll) foundBatchId = enroll.batchId;
        }
        if (!foundBatchId) {
          const anyBatch = await Batch.findOne();
          foundBatchId = anyBatch?._id;
        }
        effectiveBatchId = foundBatchId;
      }

      // Determine subject (department)
      let dept = 'Technical';
      if (req.user.role === 'Communication Trainer') dept = 'Communication';
      if (req.user.role === 'Aptitude Trainer') dept = 'Aptitude';

      // Find student's batch matching the course category / department
      let saveBatchId = effectiveBatchId;
      const targetBatch = await Batch.findById(effectiveBatchId);
      if (targetBatch) {
        saveBatchId = targetBatch._id;
      } else {
        // Fallback to active enrollment batch for this trainer's department
        const enroll = await Enrollment.findOne({ studentId: rec.studentId, department: dept, status: 'Active' });
        if (enroll) {
          saveBatchId = enroll.batchId;
        } else {
          const studentBatch = await Batch.findOne({ students: rec.studentId });
          if (studentBatch) {
            saveBatchId = studentBatch._id;
          }
        }
      }

      // Upsert attendance
      const record = await Attendance.findOneAndUpdate(
        { student: rec.studentId, batch: saveBatchId, date: formattedDate, subject: dept },
        { 
          status: rec.status || 'Present', 
          remarks: rec.remarks || '',
          scannedBatch: effectiveBatchId,
          markedBy: req.user._id 
        },
        { new: true, upsert: true }
      );
      savedRecords.push(record);

      // Create notification for student
      await Notification.create({
        recipient: rec.studentId,
        title: 'Attendance Updated',
        message: `Your attendance on ${formattedDate.toLocaleDateString()} was marked as "${rec.status}" by ${req.user.name}.`
      });
    }

    res.json({ message: 'Attendance records updated successfully', records: savedRecords });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update marks/remarks for a student's module
// @route   POST /api/trainer/score
// @access  Private (Trainer only)
export const updateStudentScore = async (req, res) => {
  const { studentId, moduleName, status, mockStatus, marks, remarks } = req.body;

  try {
    const category = getCategoryByRole(req.user.role);
    if (!category) {
      return res.status(403).json({ message: 'User is not a valid trainer' });
    }

    const effectiveStatus = mockStatus || status || 'Completed';
    const modName = moduleName || 'Mock Evaluation';

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const marksNum = isNaN(Number(marks)) ? 0 : Number(marks);

    // Upsert Score
    const score = await Score.findOneAndUpdate(
      { student: studentId, moduleName: modName, category },
      { 
        status: effectiveStatus,
        mockStatus: effectiveStatus, 
        marks: marksNum, 
        remarks: remarks || '', 
        updatedBy: req.user._id 
      },
      { new: true, upsert: true }
    );

    // Notify student
    await Notification.create({
      recipient: studentId,
      title: 'Mock Performance Updated',
      message: `Your mock evaluation performance for "${modName}" has been updated to "${effectiveStatus}" by ${req.user.name}.`
    });

    res.json({ message: 'Mock evaluation updated successfully', score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start a dynamic class session
// @route   POST /api/trainer/session/start
// @access  Private (Trainer only)
export const startSession = async (req, res) => {
  const { batchId, subject, floorNumber, roomNumber } = req.body;

  try {
    if (!batchId || !subject || !floorNumber || !roomNumber) {
      return res.status(400).json({ message: 'All session fields are required' });
    }

    // Set other sessions for this trainer to inactive
    await AttendanceSession.updateMany({ trainer: req.user._id, isActive: true }, { isActive: false });

    const trainerIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';

    const session = await AttendanceSession.create({
      trainer: req.user._id,
      batch: batchId,
      subject,
      floorNumber: floorNumber.toString(),
      roomNumber: roomNumber.toString(),
      startTime: new Date(),
      isActive: true,
      ipAddress: trainerIp
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dynamic QR code token
// @route   GET /api/trainer/session/:sessionId/qr
// @access  Private (Trainer only)
export const getQRToken = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await AttendanceSession.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(404).json({ message: 'Active class session not found or closed' });
    }

    // Generate signed JWT for the QR code, valid for 2 minutes
    const token = jwt.sign(
      {
        sessionId: session._id,
        batchId: session.batch,
        trainerId: session.trainer,
        subject: session.subject,
        floorNumber: session.floorNumber,
        roomNumber: session.roomNumber,
        generatedAt: Date.now()
      },
      process.env.JWT_SECRET || 'lcp_secret_key_123456',
      { expiresIn: '15s' }
    );

    res.json({ token, expiresAt: Date.now() + 15 * 1000 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard statistics for a trainer
// @route   GET /api/trainer/dashboard-stats
// @access  Private (Trainer only)
export const getTrainerDashboardStats = async (req, res) => {
  try {
    const trainerId = req.user._id;

    // Find batches where this trainer is assigned
    const batches = await Batch.find({ trainers: trainerId }).lean();
    const batchIds = batches.map(b => b._id);

    if (batches.length === 0) {
      return res.json({
        cards: {
          totalStudents: 0,
          totalBatches: 0,
          attendancePercentage: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
        },
        weeklyAttendance: [],
        monthlyAttendance: [],
        recentAttendance: [],
      });
    }

    // Filter by specific batch if passed in query
    const selectedBatchId = req.query.batchId;
    const targetBatchIds = selectedBatchId && batchIds.some(id => id.toString() === selectedBatchId.toString())
      ? [selectedBatchId]
      : batchIds;

    // Fetch batches populated with students
    const activeBatches = await Batch.find({ _id: { $in: targetBatchIds } })
      .populate('students', 'name email mobile status')
      .lean();

    // Collect all students (unique)
    const studentMap = {};
    activeBatches.forEach(b => {
      if (b.students) {
        b.students.forEach(s => {
          studentMap[s._id.toString()] = {
            _id: s._id,
            name: s.name,
            email: s.email,
            mobile: s.mobile,
            status: s.status,
            batchName: b.name,
          };
        });
      }
    });
    const studentsInBatches = Object.values(studentMap);
    const studentIds = Object.keys(studentMap);

    // Total counts
    const totalStudents = studentsInBatches.length;
    const totalBatches = batches.length;

    // Attendance stats
    const attendanceRecords = await Attendance.find({ 
      batch: { $in: targetBatchIds },
      student: { $in: studentIds }
    }).lean();

    const totalAttendanceCount = attendanceRecords.length;
    const presentRecordsCount = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercentage = totalAttendanceCount > 0 
      ? Math.round((presentRecordsCount / totalAttendanceCount) * 100) 
      : 100;

    // Present / Absent Today
    // Match today's records (normalized to midnight in local time context of database)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = await Attendance.find({
      batch: { $in: targetBatchIds },
      student: { $in: studentIds },
      date: today
    })
    .populate('student', 'name email')
    .populate('batch', 'name')
    .populate('markedBy', 'name')
    .lean();

    const presentToday = todayRecords.filter(a => a.status === 'Present').length;
    const absentToday = todayRecords.filter(a => a.status === 'Absent').length;
    const lateToday = todayRecords.filter(a => a.status === 'Late').length;

    // Weekly Attendance (last 7 days counts)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dayRecords = attendanceRecords.filter(rec => {
        const recDate = new Date(rec.date);
        recDate.setHours(0, 0, 0, 0);
        return recDate.getTime() === d.getTime();
      });

      const dayPresent = dayRecords.filter(r => r.status === 'Present').length;
      const dayLate = dayRecords.filter(r => r.status === 'Late').length;
      const dayAbsent = dayRecords.filter(r => r.status === 'Absent').length;

      weeklyData.push({
        day: daysOfWeek[d.getDay()],
        date: d.toISOString().split('T')[0],
        Present: dayPresent,
        Late: dayLate,
        Absent: dayAbsent,
      });
    }

    // Monthly Attendance (last 6 months counts)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (let i = 5; i >= 0; i--) {
      const m = (currentMonth - i + 12) % 12;
      const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      monthlyData.push({
        month: months[m],
        year: y,
        monthIndex: m,
        Present: 0,
        Late: 0,
        Absent: 0,
        total: 0
      });
    }

    attendanceRecords.forEach(rec => {
      if (rec.date) {
        const recDate = new Date(rec.date);
        const recMonth = recDate.getMonth();
        const recYear = recDate.getFullYear();

        const bucket = monthlyData.find(b => b.monthIndex === recMonth && b.year === recYear);
        if (bucket) {
          bucket.total += 1;
          if (rec.status === 'Present') bucket.Present += 1;
          if (rec.status === 'Late') bucket.Late += 1;
          if (rec.status === 'Absent') bucket.Absent += 1;
        }
      }
    });

    const monthlyBreakdown = monthlyData.map(b => ({
      month: b.month,
      Present: b.Present,
      Late: b.Late,
      Absent: b.Absent,
    }));

    // Today's detailed records for the Recent Attendance table
    const recentAttendance = todayRecords.map(rec => ({
      _id: rec._id,
      studentId: rec.student?._id || '—',
      studentName: rec.student?.name || '—',
      batchName: rec.batch?.name || '—',
      attendanceStatus: rec.status,
      checkInTime: rec.createdAt 
        ? new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '—',
      trainer: rec.markedBy?.name || '—',
      remarks: rec.remarks || '—',
    }));

    res.json({
      cards: {
        totalStudents,
        totalBatches,
        attendancePercentage,
        presentToday: presentToday + lateToday,
        absentToday,
        lateToday,
      },
      weeklyAttendance: weeklyData,
      monthlyAttendance: monthlyBreakdown,
      recentAttendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrainerBatches = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    const query = isAdmin ? {} : { trainers: req.user._id };
    const batches = await Batch.find(query).sort({ createdAt: -1 }).lean();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBatchAttendance = async (req, res) => {
  const { batchId, date } = req.query;

  try {
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    const records = await Attendance.find(query)
      .populate('student', 'name email slaeId batches communicationBatch technicalBatch aptitudeBatch')
      .populate('batch', 'name')
      .populate('scannedBatch', 'name')
      .lean();

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBatchByTrainer = async (req, res) => {
  const { name, batchId, course, schedule, status, trainerName } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Batch name is required' });
    }

    const generatedBatchId = batchId || `BATCH-${Date.now().toString().slice(-4)}`;
    const courseType = course || (req.user.role === 'Communication Trainer' ? 'Communication Skills' : req.user.role === 'Aptitude Trainer' ? 'Aptitude & Reasoning' : 'Technical Training');

    const batch = await Batch.create({
      name,
      batchId: generatedBatchId,
      course: courseType,
      trainerName: trainerName || req.user.name || 'Assigned Trainer',
      schedule: schedule || 'Mon-Fri (09:00 AM - 12:00 PM)',
      trainers: [req.user._id],
      students: [],
      status: status || 'Active'
    });

    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addStudentByTrainer = async (req, res) => {
  const {
    slaeId,
    name,
    email,
    mobile,
    password,
    batchId,
    technicalTrainer,
    technicalBatch,
    communicationBatch,
    aptitudeBatch,
    status
  } = req.body;

  try {
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    let user = await User.findOne({ email });
    const generatedSlaeId = slaeId || `SLA-${Date.now().toString().slice(-5)}`;

    if (user) {
      // Update existing student fields
      user.slaeId = slaeId || user.slaeId || generatedSlaeId;
      if (status) user.status = status;
      await user.save();

      if (batchId) {
        await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: user._id } });
      }
      await syncStudentBatchesFromStrings(user._id, { technicalBatch, communicationBatch, aptitudeBatch });
      return res.status(200).json({ message: 'Existing student updated and enrolled in batch successfully', user });
    }

    user = await User.create({
      name,
      email,
      mobile: mobile || '',
      password: password || (generatedSlaeId ? generatedSlaeId.toLowerCase() : 'password123'),
      role: 'Student',
      slaeId: generatedSlaeId,
      status: status || 'Active'
    });

    await Student.create({ user: user._id });
    await Placement.create({ student: user._id });

    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, { $addToSet: { students: user._id } });
    }

    await syncStudentBatchesFromStrings(user._id, { technicalBatch, communicationBatch, aptitudeBatch });

    res.status(201).json({ message: 'Student created successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBatchByTrainer = async (req, res) => {
  const { id } = req.params;
  const { batchId, name, schedule, status, course, trainerName } = req.body;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (batchId !== undefined) batch.batchId = batchId;
    if (name !== undefined) batch.name = name;
    if (schedule !== undefined) batch.schedule = schedule;
    if (status !== undefined) batch.status = status;
    if (course !== undefined) batch.course = course;
    if (trainerName !== undefined) batch.trainerName = trainerName;

    await batch.save();
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBatchByTrainer = async (req, res) => {
  const { id } = req.params;

  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    await Batch.findByIdAndDelete(id);
    res.status(200).json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStudentByTrainer = async (req, res) => {
  const { id } = req.params;
  const {
    slaeId,
    name,
    email,
    mobile,
    technicalTrainer,
    technicalBatch,
    communicationBatch,
    aptitudeBatch,
    status
  } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (slaeId !== undefined) user.slaeId = slaeId;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (mobile !== undefined) user.mobile = mobile;
    if (status !== undefined) user.status = status;

    await user.save();
    await syncStudentBatchesFromStrings(user._id, { technicalBatch, communicationBatch, aptitudeBatch });
    res.status(200).json({ message: 'Student updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStudentByTrainer = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await User.findByIdAndDelete(id);
    await Student.deleteOne({ user: id });
    await Batch.updateMany({ students: id }, { $pull: { students: id } });

    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBatchStudents = async (req, res) => {
  const { id } = req.params;
  try {
    const enrollments = await Enrollment.find({ batchId: id, status: 'Active' })
      .populate('studentId', 'name email mobile status slaeId')
      .lean();
    const students = enrollments.map(e => ({
      ...e.studentId,
      enrollmentId: e._id,
      enrolledAt: e.enrolledAt,
    }));
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addStudentToBatch = async (req, res) => {
  const { id } = req.params;
  const { slaeId } = req.body;
  try {
    const student = await User.findOne({ slaeId, role: 'Student' });
    if (!student) {
      return res.status(404).json({ message: `Student with EID "${slaeId}" not found.` });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    let dept = 'Technical';
    if (batch.course.includes('Communication')) dept = 'Communication';
    if (batch.course.includes('Aptitude')) dept = 'Aptitude';

    const existing = await Enrollment.findOne({ studentId: student._id, batchId: batch._id, status: 'Active' });
    if (existing) {
      return res.status(400).json({ message: 'Student is already actively enrolled in this batch.' });
    }

    if (dept === 'Communication' || dept === 'Aptitude') {
      const activeEnroll = await Enrollment.findOne({ studentId: student._id, department: dept, status: 'Active' });
      if (activeEnroll) {
        activeEnroll.status = 'Completed';
        activeEnroll.completedAt = new Date();
        await activeEnroll.save();
        await Batch.findByIdAndUpdate(activeEnroll.batchId, { $pull: { students: student._id } });
      }
    }

    const trainerId = batch.trainers?.[0] || req.user._id;
    await Enrollment.create({
      studentId: student._id,
      batchId: batch._id,
      trainerId,
      department: dept,
      course: batch.course,
      status: 'Active',
      enrolledAt: new Date()
    });

    await Batch.findByIdAndUpdate(id, { $addToSet: { students: student._id } });

    res.status(201).json({ message: 'Student assigned to batch successfully', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeStudentFromBatch = async (req, res) => {
  const { id, studentId } = req.params;
  try {
    const enroll = await Enrollment.findOne({ studentId, batchId: id, status: 'Active' });
    if (enroll) {
      enroll.status = 'Completed';
      enroll.completedAt = new Date();
      await enroll.save();
    }

    await Batch.findByIdAndUpdate(id, { $pull: { students: studentId } });
    res.json({ message: 'Student removed from batch successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const transferStudents = async (req, res) => {
  const { sourceBatchId, destBatchId, studentIds } = req.body;
  try {
    const sourceBatch = await Batch.findById(sourceBatchId);
    const destBatch = await Batch.findById(destBatchId);
    if (!sourceBatch || !destBatch) {
      return res.status(404).json({ message: 'Source or destination batch not found.' });
    }

    let dept = 'Technical';
    if (destBatch.course.includes('Communication')) dept = 'Communication';
    if (destBatch.course.includes('Aptitude')) dept = 'Aptitude';

    const trainerId = destBatch.trainers?.[0] || req.user._id;

    for (const studentId of studentIds) {
      const oldEnroll = await Enrollment.findOne({ studentId, batchId: sourceBatchId, status: 'Active' });
      if (oldEnroll) {
        oldEnroll.status = 'Completed';
        oldEnroll.completedAt = new Date();
        await oldEnroll.save();
      }
      await Batch.findByIdAndUpdate(sourceBatchId, { $pull: { students: studentId } });

      if (dept === 'Communication' || dept === 'Aptitude') {
        const activeEnroll = await Enrollment.findOne({ studentId, department: dept, status: 'Active' });
        if (activeEnroll) {
          activeEnroll.status = 'Completed';
          activeEnroll.completedAt = new Date();
          await activeEnroll.save();
          await Batch.findByIdAndUpdate(activeEnroll.batchId, { $pull: { students: studentId } });
        }
      }

      await Enrollment.findOneAndUpdate(
        { studentId, batchId: destBatchId, department: dept },
        {
          trainerId,
          course: destBatch.course,
          status: 'Active',
          enrolledAt: new Date()
        },
        { upsert: true, new: true }
      );

      await Batch.findByIdAndUpdate(destBatchId, { $addToSet: { students: studentId } });
    }

    res.json({ message: `Successfully transferred ${studentIds.length} students.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkImportStudents = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Batch not found.' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    if (!data || data.length === 0) {
      return res.json({ successCount: 0, skippedCount: 0, failedCount: 0 });
    }

    let dept = 'Technical';
    if (batch.course?.includes('Communication')) dept = 'Communication';
    if (batch.course?.includes('Aptitude')) dept = 'Aptitude';

    const trainerId = batch.trainers?.[0] || req.user._id;

    // 1. Extract valid SLAEIDs and row values
    const rowsToProcess = [];
    let failedCount = 0;

    for (const row of data) {
      const rowKeys = Object.keys(row);
      const getVal = (possibleKeys) => {
        const matchingKey = rowKeys.find(k => {
          const cleanK = k.replace(/[\s\-_]+/g, '').toLowerCase();
          return possibleKeys.includes(cleanK);
        });
        return matchingKey ? String(row[matchingKey]).trim() : '';
      };

      const slaeId = getVal(['eid', 'slaeid', 'id', 'studentworkid', 'rollno', 'registerid']);
      if (!slaeId) {
        failedCount++;
        continue;
      }

      const nameVal = getVal(['name', 'studentname', 'fullname', 'username']);
      rowsToProcess.push({ slaeId, nameVal });
    }

    if (rowsToProcess.length === 0) {
      return res.json({ successCount: 0, skippedCount: 0, failedCount });
    }

    const slaeIds = [...new Set(rowsToProcess.map(r => r.slaeId))];

    // 2. Pre-fetch existing Users in bulk
    const existingUsers = await User.find({ slaeId: { $in: slaeIds }, role: 'Student' }).lean();
    const userMap = new Map();
    existingUsers.forEach(u => userMap.set(u.slaeId.toLowerCase(), u));

    // 3. Create non-existent users in bulk
    const newUsersToCreate = [];
    const createdSlaeSet = new Set();
    const salt = await bcrypt.genSalt(10);

    for (const r of rowsToProcess) {
      const lowerSlae = r.slaeId.toLowerCase();
      if (!userMap.has(lowerSlae) && !createdSlaeSet.has(lowerSlae)) {
        const name = r.nameVal || `Student ${r.slaeId}`;
        const email = `${lowerSlae}@lcp.com`;
        const newId = new mongoose.Types.ObjectId();
        const hashedPassword = await bcrypt.hash(lowerSlae, salt);

        newUsersToCreate.push({
          _id: newId,
          name,
          email,
          mobile: '9999999999',
          password: hashedPassword,
          role: 'Student',
          status: 'Active',
          slaeId: r.slaeId,
        });
        createdSlaeSet.add(lowerSlae);
      }
    }

    if (newUsersToCreate.length > 0) {
      await User.insertMany(newUsersToCreate, { ordered: false });

      const newStudentProfiles = newUsersToCreate.map(u => ({
        user: u._id,
        collegeName: '',
        degree: '',
        department: '',
        yearOfPassing: '',
      }));
      await Student.insertMany(newStudentProfiles, { ordered: false });

      const newPlacements = newUsersToCreate.map(u => ({
        student: u._id,
      }));
      await Placement.insertMany(newPlacements, { ordered: false });

      newUsersToCreate.forEach(u => userMap.set(u.slaeId.toLowerCase(), u));
    }

    // 4. Pre-fetch existing active enrollments in bulk
    const allUserIds = Array.from(userMap.values()).map(u => u._id);
    const existingEnrollments = await Enrollment.find({
      studentId: { $in: allUserIds },
      status: 'Active'
    }).lean();

    const enrollmentSet = new Set(
      existingEnrollments.map(e => `${e.studentId.toString()}_${e.batchId.toString()}`)
    );

    // If Communication or Aptitude, update old active domain enrollments in bulk
    if (dept === 'Communication' || dept === 'Aptitude') {
      const activeDomainEnrollmentsToComplete = existingEnrollments.filter(
        e => e.department === dept && e.batchId.toString() !== id.toString()
      );

      if (activeDomainEnrollmentsToComplete.length > 0) {
        const idsToComplete = activeDomainEnrollmentsToComplete.map(e => e._id);
        await Enrollment.updateMany(
          { _id: { $in: idsToComplete } },
          { $set: { status: 'Completed', completedAt: new Date() } }
        );

        // Batch pull student IDs from previous domain batches in bulk
        const prevBatchGroup = {};
        activeDomainEnrollmentsToComplete.forEach(e => {
          const bId = e.batchId.toString();
          if (!prevBatchGroup[bId]) prevBatchGroup[bId] = [];
          prevBatchGroup[bId].push(e.studentId);
        });

        for (const [prevBatchId, stuIds] of Object.entries(prevBatchGroup)) {
          await Batch.findByIdAndUpdate(prevBatchId, { $pull: { students: { $in: stuIds } } });
        }
      }
    }

    // 5. Prepare new enrollments & batch addition in bulk
    let successCount = 0;
    let skippedCount = 0;
    const newEnrollmentsToInsert = [];
    const studentIdsToAddToCurrentBatch = new Set();
    const processedPairs = new Set();

    for (const r of rowsToProcess) {
      const student = userMap.get(r.slaeId.toLowerCase());
      if (!student) {
        failedCount++;
        continue;
      }

      const pairKey = `${student._id.toString()}_${id}`;
      if (enrollmentSet.has(pairKey) || processedPairs.has(pairKey)) {
        skippedCount++;
        continue;
      }

      processedPairs.add(pairKey);
      newEnrollmentsToInsert.push({
        studentId: student._id,
        batchId: id,
        trainerId,
        department: dept,
        course: batch.course,
        status: 'Active',
        enrolledAt: new Date()
      });

      studentIdsToAddToCurrentBatch.add(student._id);
      successCount++;
    }

    if (newEnrollmentsToInsert.length > 0) {
      await Enrollment.insertMany(newEnrollmentsToInsert, { ordered: false });
      await Batch.findByIdAndUpdate(id, {
        $addToSet: { students: { $each: Array.from(studentIdsToAddToCurrentBatch) } }
      });
    }

    res.json({ successCount, skippedCount, failedCount });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Bulk import error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const searchStudents = async (req, res) => {
  const { query } = req.query;
  try {
    if (!query) {
      return res.json([]);
    }
    const students = await User.find({
      role: 'Student',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { slaeId: { $regex: query, $options: 'i' } },
        { mobile: { $regex: query, $options: 'i' } }
      ]
    }).select('name email mobile slaeId').limit(10).lean();
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
