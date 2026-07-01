import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import AttendanceSession from '../models/AttendanceSession.js';
import jwt from 'jsonwebtoken';

// Helper to map trainer role to score category
const getCategoryByRole = (role) => {
  if (role === 'Aptitude Trainer') return 'Aptitude';
  if (role === 'Communication Trainer') return 'Communication';
  if (role === 'Technical Trainer') return 'Technical';
  return null;
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

    // Find batches where this trainer is assigned
    const batches = await Batch.find({ trainers: req.user._id })
      .populate('students', 'name email mobile status')
      .lean();

    // Consolidate student details
    const studentMap = {};
    
    for (const batch of batches) {
      for (const std of batch.students) {
        if (!studentMap[std._id]) {
          studentMap[std._id] = {
            _id: std._id,
            name: std.name,
            email: std.email,
            mobile: std.mobile,
            status: std.status,
            batches: [{ _id: batch._id, name: batch.name, course: batch.course }]
          };
        } else {
          studentMap[std._id].batches.push({ _id: batch._id, name: batch.name, course: batch.course });
        }
      }
    }

    const studentIds = Object.keys(studentMap);
    
    // Fetch profiles, scores, and attendance counts
    const profiles = await Student.find({ user: { $in: studentIds } }).lean();
    const scores = await Score.find({ student: { $in: studentIds }, category }).lean();
    
    const studentsList = studentIds.map(id => {
      const studentData = studentMap[id];
      const profile = profiles.find(p => p.user.toString() === id.toString()) || {};
      const studentScores = scores.filter(s => s.student.toString() === id.toString());
      
      // Calculate overall progress in trainer's category
      // Hardcode total modules based on category
      let totalModules = 16; // Aptitude
      if (category === 'Communication') totalModules = 11;
      if (category === 'Technical') totalModules = 14;

      const completedCount = studentScores.filter(s => s.status === 'Completed').length;
      const progressPercent = Math.round((completedCount / totalModules) * 100);

      return {
        ...studentData,
        profile,
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
    if (!batchId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid attendance submit details' });
    }

    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0); // normalize date

    const savedRecords = [];

    for (const rec of records) {
      // Upsert attendance
      const record = await Attendance.findOneAndUpdate(
        { student: rec.studentId, batch: batchId, date: formattedDate },
        { 
          status: rec.status, 
          remarks: rec.remarks || '',
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
  const { studentId, moduleName, status, marks, remarks } = req.body;

  try {
    const category = getCategoryByRole(req.user.role);
    if (!category) {
      return res.status(403).json({ message: 'User is not a valid trainer' });
    }

    if (!studentId || !moduleName || !status) {
      return res.status(400).json({ message: 'Student, module name, and status are required' });
    }

    const marksNum = Number(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 10) {
      return res.status(400).json({ message: 'Marks must be a number between 0 and 10' });
    }

    // Upsert Score
    const score = await Score.findOneAndUpdate(
      { student: studentId, moduleName, category },
      { 
        status, 
        marks: marksNum, 
        remarks: remarks || '', 
        updatedBy: req.user._id 
      },
      { new: true, upsert: true }
    );

    // Notify student
    await Notification.create({
      recipient: studentId,
      title: 'Module Progress Graded',
      message: `Your progress on module "${moduleName}" has been updated to "${status}" with score ${marksNum}/10 by ${req.user.name}.`
    });

    res.json({ message: 'Score updated successfully', score });
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

    const session = await AttendanceSession.create({
      trainer: req.user._id,
      batch: batchId,
      subject,
      floorNumber: floorNumber.toString(),
      roomNumber: roomNumber.toString(),
      startTime: new Date(),
      isActive: true,
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
      { expiresIn: '2m' }
    );

    res.json({ token, expiresAt: Date.now() + 2 * 60 * 1000 });
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
