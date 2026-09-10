import { scanQR } from './studentController.js';
import { attendanceDayRange, attendanceDayEnd } from '../utils/attendanceDate.js';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import {
  calculateStudentAttendanceEngine,
  calculateMonthlyAttendanceSummary,
  calculateBatchAttendanceSummary,
  recordManualAttendance,
  recordBulkAttendance,
  normalizeDate,
  formatDateISO,
  formatDateDisplay,
  standardizeStatus,
  standardizeMode
} from '../services/attendanceEngine.js';

// Standardized API response helper
const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data
  });
};

/**
 * @desc    Get complete attendance stats for a student
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { batchId, course, startDate, endDate } = req.query;

    const stats = await calculateStudentAttendanceEngine(studentId, {
      batchId,
      course,
      startDate,
      endDate
    });

    return sendResponse(res, 200, true, 'Attendance fetched successfully', stats);
  } catch (error) {
    console.error('getStudentAttendance error:', error);
    return sendResponse(res, 500, false, error.message || 'Failed to fetch student attendance');
  }
};

/**
 * @desc    Get monthly and overall attendance summary for a student
 * @route   GET /api/attendance/student/:studentId/summary
 * @access  Private
 */
export const getStudentMonthlySummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [overallStats, monthlySummary] = await Promise.all([
      calculateStudentAttendanceEngine(studentId),
      calculateMonthlyAttendanceSummary(studentId)
    ]);

    return sendResponse(res, 200, true, 'Attendance summary fetched successfully', {
      student: overallStats.student,
      overall: {
        totalClasses: overallStats.totalApplicableClasses,
        presentCount: overallStats.presentCount,
        absentCount: overallStats.absentCount,
        leaveCount: overallStats.leaveCount,
        attendancePercentage: overallStats.attendancePercentage,
        lastAttendanceDate: overallStats.lastAttendanceDate,
        currentAttendanceStatus: overallStats.currentAttendanceStatus
      },
      currentMonth: monthlySummary.currentMonth,
      previousMonth: monthlySummary.previousMonth
    });
  } catch (error) {
    console.error('getStudentMonthlySummary error:', error);
    return sendResponse(res, 500, false, error.message || 'Failed to fetch attendance summary');
  }
};

/**
 * @desc    Get detailed attendance history for a student with filters
 * @route   GET /api/attendance/student/:studentId/history
 * @access  Private
 */
export const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      startDate,
      endDate,
      batchId,
      course,
      status,
      attendanceMode,
      page = 1,
      limit = 50
    } = req.query;

    const sObjectId = new mongoose.Types.ObjectId(studentId);
    const query = { student: sObjectId };

    if (batchId) query.batch = new mongoose.Types.ObjectId(batchId);
    if (course) query.$or = [{ course: course }, { subject: course }];
    if (status) query.status = standardizeStatus(status);
    if (attendanceMode) query.attendanceMode = standardizeMode(attendanceMode);

    const dateFilter = {};
    if (startDate) dateFilter.$gte = normalizeDate(startDate);
    if (endDate) dateFilter.$lte = attendanceDayEnd(endDate);
    if (Object.keys(dateFilter).length > 0) query.date = dateFilter;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalRecords = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate('batch', 'name course')
      .populate('markedBy', 'name role')
      .populate('updatedBy', 'name role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formattedRecords = records.map(r => ({
      _id: r._id,
      date: formatDateISO(r.date),
      displayDate: formatDateDisplay(r.date),
      status: standardizeStatus(r.status),
      attendanceMode: standardizeMode(r.attendanceMode),
      course: r.course || r.subject || '',
      batch: {
        _id: r.batch?._id,
        name: r.batch?.name || ''
      },
      timeIn: r.timeIn || '',
      remarks: r.remarks || '',
      markedBy: r.markedBy?.name || 'System',
      updatedBy: r.updatedBy?.name || null,
      updatedAt: r.updatedAt
    }));

    return sendResponse(res, 200, true, 'Attendance history fetched successfully', {
      total: totalRecords,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalRecords / parseInt(limit)),
      records: formattedRecords
    });
  } catch (error) {
    console.error('getStudentAttendanceHistory error:', error);
    return sendResponse(res, 500, false, error.message || 'Failed to fetch attendance history');
  }
};

/**
 * @desc    Get list of dates on which the student was present
 * @route   GET /api/attendance/student/:studentId/present-dates
 * @access  Private
 */
export const getStudentPresentDates = async (req, res) => {
  try {
    const { studentId } = req.params;
    const stats = await calculateStudentAttendanceEngine(studentId);
    return sendResponse(res, 200, true, 'Present dates fetched successfully', {
      totalPresent: stats.presentCount,
      presentDates: stats.presentDates
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

/**
 * @desc    Get list of dates on which the student was on leave
 * @route   GET /api/attendance/student/:studentId/leave-dates
 * @access  Private
 */
export const getStudentLeaveDates = async (req, res) => {
  try {
    const { studentId } = req.params;
    const stats = await calculateStudentAttendanceEngine(studentId);
    return sendResponse(res, 200, true, 'Leave dates fetched successfully', {
      totalLeave: stats.leaveCount,
      leaveDates: stats.leaveDates
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

/**
 * @desc    Get list of dates on which the student was absent
 * @route   GET /api/attendance/student/:studentId/absent-dates
 * @access  Private
 */
export const getStudentAbsentDates = async (req, res) => {
  try {
    const { studentId } = req.params;
    const stats = await calculateStudentAttendanceEngine(studentId);
    return sendResponse(res, 200, true, 'Absent dates fetched successfully', {
      totalAbsent: stats.absentCount,
      absentDates: stats.absentDates
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

/**
 * @desc    Get Batch Attendance Summary with clusters (>90%, 75-90%, <75%)
 * @route   GET /api/attendance/batch/:batchId
 * @access  Private (Trainer/Admin)
 */
export const getBatchAttendanceSummary = async (req, res) => {
  try {
    const { batchId } = req.params;
    const summary = await calculateBatchAttendanceSummary(batchId);
    return sendResponse(res, 200, true, 'Batch attendance summary fetched successfully', summary);
  } catch (error) {
    console.error('getBatchAttendanceSummary error:', error);
    return sendResponse(res, 500, false, error.message || 'Failed to fetch batch summary');
  }
};

/**
 * @desc    Get Batch Roll Call for a specific Date
 * @route   GET /api/attendance/batch/:batchId/date/:date
 * @access  Private (Trainer/Admin)
 */
export const getBatchDailyAttendance = async (req, res) => {
  try {
    const { batchId, date } = req.params;
    const bObjectId = new mongoose.Types.ObjectId(batchId);
    const normalizedDate = normalizeDate(date);

    const [batch, enrollments, records] = await Promise.all([
      Batch.findById(bObjectId).lean(),
      Enrollment.find({ batchId: bObjectId, status: 'Active' })
        .populate('studentId', 'name email slaeId photo')
        .lean(),
      Attendance.find({ batch: bObjectId, date: attendanceDayRange(normalizedDate) })
        .populate('student', 'name email slaeId')
        .populate('markedBy', 'name role')
        .lean()
    ]);

    if (!batch) {
      return sendResponse(res, 404, false, 'Batch not found');
    }

    const recordMap = new Map();
    records.forEach(r => {
      if (r.student?._id) {
        recordMap.set(String(r.student._id), r);
      }
    });

    const studentsRollCall = enrollments.map(enroll => {
      const stu = enroll.studentId;
      if (!stu) return null;
      const rec = recordMap.get(String(stu._id));

      return {
        studentId: stu._id,
        name: stu.name,
        email: stu.email,
        slaeId: stu.slaeId || `SLA-${String(stu._id).slice(-5).toUpperCase()}`,
        photo: stu.photo || '',
        status: rec ? standardizeStatus(rec.status) : 'Pending',
        attendanceMode: rec ? standardizeMode(rec.attendanceMode) : 'MANUAL',
        timeIn: rec?.timeIn || '',
        remarks: rec?.remarks || '',
        isRecorded: !!rec,
        markedAt: rec?.createdAt || null
      };
    }).filter(Boolean);

    const presentCount = studentsRollCall.filter(s => s.status === 'Present').length;
    const absentCount = studentsRollCall.filter(s => s.status === 'Absent').length;
    const leaveCount = studentsRollCall.filter(s => s.status === 'Leave').length;

    return sendResponse(res, 200, true, 'Daily roll call fetched successfully', {
      batch: {
        _id: batch._id,
        name: batch.name,
        course: batch.course,
        schedule: batch.schedule
      },
      date: formatDateISO(normalizedDate),
      displayDate: formatDateDisplay(normalizedDate),
      totalStudents: studentsRollCall.length,
      presentCount,
      absentCount,
      leaveCount,
      pendingCount: studentsRollCall.filter(s => s.status === 'Pending').length,
      students: studentsRollCall
    });
  } catch (error) {
    console.error('getBatchDailyAttendance error:', error);
    return sendResponse(res, 500, false, error.message || 'Failed to fetch daily attendance');
  }
};

/**
 * @desc    Mark a Single Manual Attendance Record
 * @route   POST /api/attendance/manual
 * @access  Private (Trainer/Admin)
 */
export const markSingleManualAttendance = async (req, res) => {
  try {
    const { studentId, batchId, courseId, classDate, sessionId, status, remarks, timeIn } = req.body;

    const record = await recordManualAttendance({
      studentId,
      batchId,
      courseId,
      classDate,
      sessionId,
      status,
      remarks,
      timeIn,
      user: req.user
    });

    return sendResponse(res, 200, true, 'Attendance recorded successfully', record);
  } catch (error) {
    console.error('markSingleManualAttendance error:', error);
    return sendResponse(res, 400, false, error.message || 'Failed to record attendance');
  }
};

/**
 * @desc    Bulk Attendance Submission (Manual or System)
 * @route   POST /api/attendance/bulk
 * @access  Private (Trainer/Admin)
 */
export const submitBulkAttendance = async (req, res) => {
  try {
    const { batchId, courseId, classDate, sessionId, attendanceMode, records } = req.body;

    if (!batchId || !classDate || !Array.isArray(records)) {
      return sendResponse(res, 400, false, 'Invalid payload: batchId, classDate, and records array required');
    }

    const result = await recordBulkAttendance({
      batchId,
      courseId,
      classDate,
      sessionId,
      attendanceMode: attendanceMode || 'MANUAL',
      records,
      user: req.user
    });

    return sendResponse(res, 200, true, 'Bulk attendance processed successfully', result);
  } catch (error) {
    console.error('submitBulkAttendance error:', error);
    return sendResponse(res, 500, false, error.message || 'Failed to process bulk attendance');
  }
};

/**
 * @desc    Update Existing Attendance Record
 * @route   PUT /api/attendance/:attendanceId
 * @access  Private (Trainer/Admin)
 */
export const updateAttendanceRecord = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, remarks, timeIn } = req.body;

    const existing = await Attendance.findById(attendanceId);
    if (!existing) {
      return sendResponse(res, 404, false, 'Attendance record not found');
    }

    if (status) existing.status = standardizeStatus(status);
    if (remarks !== undefined) existing.remarks = remarks;
    if (timeIn) existing.timeIn = timeIn;
    existing.updatedBy = req.user?._id;

    await existing.save();

    return sendResponse(res, 200, true, 'Attendance record updated successfully', existing);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

/**
 * @desc    Unified QR Scan Attendance Endpoint
 * @route   POST /api/attendance/scan
 * @access  Private (Student only)
 */
export const submitScanAttendance = async (req, res) => {
  // Keep this endpoint's response envelope while using the same scan rules as web/mobile.
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) {
      return sendResponse(res, this.statusCode, this.statusCode < 400,
        payload.message, payload.attendance || null);
    }
  };
  return scanQR(req, response);
};
