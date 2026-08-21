import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import Holiday from '../models/Holiday.js';
import AttendanceSession from '../models/AttendanceSession.js';

// Configuration: Determine whether Leave days are excluded from the attendance denominator
export const ATTENDANCE_POLICY = {
  EXCLUDE_LEAVE_FROM_PERCENTAGE: process.env.ATTENDANCE_EXCLUDE_LEAVE === 'true' || false,
  MIN_REQUIRED_PERCENTAGE: 75,
  EXCELLENT_PERCENTAGE: 90,
};

// Normalize Date to Midnight UTC/Local (00:00:00.000)
export const normalizeDate = (inputDate) => {
  if (!inputDate) return null;
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

// Format Date as ISO String YYYY-MM-DD
export const formatDateISO = (inputDate) => {
  if (!inputDate) return '';
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

// Format Date as user-friendly Display String (e.g., "21 Aug 2026")
export const formatDateDisplay = (inputDate) => {
  if (!inputDate) return '';
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Standardize Attendance Status
export const standardizeStatus = (status) => {
  if (!status) return 'Present';
  const s = String(status).trim().toUpperCase();
  if (s === 'PRESENT') return 'Present';
  if (s === 'ABSENT') return 'Absent';
  if (s === 'LEAVE' || s === 'EXCUSED') return 'Leave';
  if (s === 'LATE') return 'Present'; // Count Late as Present in standard roll call
  return 'Present';
};

// Standardize Attendance Mode
export const standardizeMode = (mode) => {
  if (!mode) return 'MANUAL';
  const m = String(mode).trim().toUpperCase();
  return m === 'SCAN' ? 'SCAN' : 'MANUAL';
};

/**
 * Checks if a given date is an applicable scheduled class day
 * (Excludes Sundays, optional Saturdays based on batch schedule, and holidays)
 */
export const isScheduledClassDay = (dateObj, batchSchedule = null, holidaySet = new Set()) => {
  const dStr = formatDateISO(dateObj);
  if (holidaySet.has(dStr)) return false;

  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
  if (dayOfWeek === 0) return false; // Sunday is non-class day

  if (batchSchedule && typeof batchSchedule === 'string') {
    const sLower = batchSchedule.toLowerCase();
    if (sLower.includes('mon - fri') || sLower.includes('mon-fri') || sLower.includes('weekdays')) {
      if (dayOfWeek === 6) return false; // Saturday excluded
    }
  } else {
    // Default: Monday to Friday
    if (dayOfWeek === 6) return false;
  }

  return true;
};

/**
 * Calculates Single Student Attendance Statistics from source of truth records
 */
export const calculateStudentAttendanceEngine = async (studentId, options = {}) => {
  const sObjectId = new mongoose.Types.ObjectId(studentId);
  const { batchId = null, course = null, startDate = null, endDate = null } = options;

  // 1. Fetch Student & Active Enrollments
  const [studentUser, enrollments, holidays] = await Promise.all([
    User.findById(sObjectId).select('name email slaeId phone role status').lean(),
    Enrollment.find({ studentId: sObjectId, status: 'Active' })
      .populate('batchId', 'name course schedule startDate endDate trainers')
      .lean(),
    Holiday.find().lean()
  ]);

  if (!studentUser) {
    throw new Error('Student not found');
  }

  const holidaySet = new Set((holidays || []).map(h => formatDateISO(h.date)));

  // Target Batch determination
  let targetBatch = null;
  if (batchId) {
    targetBatch = await Batch.findById(batchId).lean();
  } else if (enrollments.length > 0) {
    targetBatch = enrollments[0].batchId;
  }

  // 2. Build attendance query
  const attQuery = { student: sObjectId };
  if (batchId) attQuery.batch = new mongoose.Types.ObjectId(batchId);
  if (course) attQuery.course = course;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = normalizeDate(startDate);
  if (endDate) dateFilter.$lte = normalizeDate(endDate);
  if (Object.keys(dateFilter).length > 0) attQuery.date = dateFilter;

  const attendanceRecords = await Attendance.find(attQuery)
    .populate('batch', 'name course')
    .populate('markedBy', 'name role')
    .populate('updatedBy', 'name role')
    .sort({ date: -1 })
    .lean();

  // 3. Aggregate Present, Absent, Leave counts and date lists
  const presentDates = [];
  const absentDates = [];
  const leaveDates = [];
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  attendanceRecords.forEach(rec => {
    const stdStatus = standardizeStatus(rec.status);
    const dateDisplay = formatDateDisplay(rec.date);
    const dateISO = formatDateISO(rec.date);

    if (stdStatus === 'Present') {
      presentCount++;
      presentDates.push({ date: dateISO, display: dateDisplay, mode: rec.attendanceMode || 'MANUAL' });
    } else if (stdStatus === 'Absent') {
      absentCount++;
      absentDates.push({ date: dateISO, display: dateDisplay, mode: rec.attendanceMode || 'MANUAL' });
    } else if (stdStatus === 'Leave') {
      leaveCount++;
      leaveDates.push({ date: dateISO, display: dateDisplay, mode: rec.attendanceMode || 'MANUAL', remarks: rec.remarks || '' });
    }
  });

  const totalClassesRecorded = presentCount + absentCount + leaveCount;
  const applicableClasses = totalClassesRecorded;

  // 4. Calculate Percentage based on configured policy
  let effectiveDenominator = applicableClasses;
  if (ATTENDANCE_POLICY.EXCLUDE_LEAVE_FROM_PERCENTAGE) {
    effectiveDenominator = Math.max(0, applicableClasses - leaveCount);
  }

  const attendancePercentage = effectiveDenominator > 0
    ? parseFloat(((presentCount / effectiveDenominator) * 100).toFixed(2))
    : (applicableClasses === 0 ? 100 : 0);

  const lastRecord = attendanceRecords[0] || null;

  return {
    student: {
      _id: studentUser._id,
      name: studentUser.name,
      email: studentUser.email,
      slaeId: studentUser.slaeId || `SLA-${String(studentUser._id).slice(-5).toUpperCase()}`,
      phone: studentUser.phone || '',
    },
    batch: targetBatch ? {
      _id: targetBatch._id,
      name: targetBatch.name,
      course: targetBatch.course || '',
      schedule: targetBatch.schedule || '',
      startDate: targetBatch.startDate,
      endDate: targetBatch.endDate
    } : null,
    totalApplicableClasses: applicableClasses,
    totalClasses: applicableClasses,
    presentCount,
    absentCount,
    leaveCount,
    attendancePercentage,
    lastAttendanceDate: lastRecord ? formatDateDisplay(lastRecord.date) : 'N/A',
    currentAttendanceStatus: lastRecord ? standardizeStatus(lastRecord.status) : 'Unrecorded',
    presentDates,
    absentDates,
    leaveDates,
    records: attendanceRecords.map(r => ({
      _id: r._id,
      date: formatDateISO(r.date),
      displayDate: formatDateDisplay(r.date),
      status: standardizeStatus(r.status),
      attendanceMode: standardizeMode(r.attendanceMode),
      course: r.course || r.subject || '',
      batchName: r.batch?.name || '',
      timeIn: r.timeIn || '',
      remarks: r.remarks || '',
      markedBy: r.markedBy?.name || 'System',
      updatedBy: r.updatedBy?.name || null,
      updatedAt: r.updatedAt
    }))
  };
};

/**
 * Calculates Monthly Attendance Breakdown for a Student (Current Month & Previous Month)
 */
export const calculateMonthlyAttendanceSummary = async (studentId, options = {}) => {
  const sObjectId = new mongoose.Types.ObjectId(studentId);
  const now = new Date();
  
  // Current Month range
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Previous Month range
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [currentMonthRecords, prevMonthRecords] = await Promise.all([
    Attendance.find({
      student: sObjectId,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    }).lean(),
    Attendance.find({
      student: sObjectId,
      date: { $gte: prevMonthStart, $lte: prevMonthEnd }
    }).lean()
  ]);

  const compileMonthStats = (records, monthName, year) => {
    let present = 0, absent = 0, leave = 0;
    records.forEach(r => {
      const st = standardizeStatus(r.status);
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Leave') leave++;
    });

    const total = present + absent + leave;
    const denominator = ATTENDANCE_POLICY.EXCLUDE_LEAVE_FROM_PERCENTAGE ? Math.max(0, total - leave) : total;
    const percentage = denominator > 0 ? parseFloat(((present / denominator) * 100).toFixed(2)) : (total === 0 ? 100 : 0);

    return {
      month: monthName,
      year,
      totalClasses: total,
      present,
      absent,
      leave,
      percentage
    };
  };

  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthName = prevMonthDate.toLocaleString('en-US', { month: 'long' });

  return {
    currentMonth: compileMonthStats(currentMonthRecords, currentMonthName, now.getFullYear()),
    previousMonth: compileMonthStats(prevMonthRecords, prevMonthName, prevMonthDate.getFullYear())
  };
};

/**
 * Calculates Batch Attendance Summary with performance clusters (>90%, 75-90%, <75%)
 */
export const calculateBatchAttendanceSummary = async (batchId) => {
  const bObjectId = new mongoose.Types.ObjectId(batchId);

  const [batch, enrollments] = await Promise.all([
    Batch.findById(bObjectId).lean(),
    Enrollment.find({ batchId: bObjectId, status: 'Active' })
      .populate('studentId', 'name email slaeId phone')
      .lean()
  ]);

  if (!batch) {
    throw new Error('Batch not found');
  }

  const studentIds = enrollments.map(e => e.studentId?._id || e.studentId).filter(Boolean);
  
  // Aggregate all attendance for this batch
  const attendanceRecords = await Attendance.find({ batch: bObjectId }).lean();

  const studentAttendanceMap = new Map();
  studentIds.forEach(id => {
    studentAttendanceMap.set(String(id), { present: 0, absent: 0, leave: 0 });
  });

  attendanceRecords.forEach(rec => {
    const sId = String(rec.student);
    if (!studentAttendanceMap.has(sId)) {
      studentAttendanceMap.set(sId, { present: 0, absent: 0, leave: 0 });
    }
    const stat = studentAttendanceMap.get(sId);
    const st = standardizeStatus(rec.status);
    if (st === 'Present') stat.present++;
    else if (st === 'Absent') stat.absent++;
    else if (st === 'Leave') stat.leave++;
  });

  let totalPercentageSum = 0;
  const above90 = [];
  const between75And90 = [];
  const below75 = [];
  const studentSummaries = [];

  enrollments.forEach(enroll => {
    const stu = enroll.studentId;
    if (!stu) return;
    const sId = String(stu._id);
    const counts = studentAttendanceMap.get(sId) || { present: 0, absent: 0, leave: 0 };
    const total = counts.present + counts.absent + counts.leave;
    const denom = ATTENDANCE_POLICY.EXCLUDE_LEAVE_FROM_PERCENTAGE ? Math.max(0, total - counts.leave) : total;
    const pct = denom > 0 ? parseFloat(((counts.present / denom) * 100).toFixed(2)) : 100;

    totalPercentageSum += pct;

    const studentItem = {
      studentId: stu._id,
      name: stu.name,
      email: stu.email,
      slaeId: stu.slaeId || `SLA-${String(stu._id).slice(-5).toUpperCase()}`,
      present: counts.present,
      absent: counts.absent,
      leave: counts.leave,
      totalClasses: total,
      percentage: pct
    };

    studentSummaries.push(studentItem);

    if (pct >= 90) above90.push(studentItem);
    else if (pct >= 75) between75And90.push(studentItem);
    else below75.push(studentItem);
  });

  const totalStudents = studentSummaries.length;
  const averageAttendance = totalStudents > 0 ? parseFloat((totalPercentageSum / totalStudents).toFixed(2)) : 100;

  return {
    batch: {
      _id: batch._id,
      name: batch.name,
      course: batch.course,
      schedule: batch.schedule,
      startDate: batch.startDate,
      endDate: batch.endDate
    },
    totalStudents,
    averageAttendance,
    above90Count: above90.length,
    between75And90Count: between75And90.length,
    below75Count: below75.length,
    studentsAbove90: above90,
    studentsBetween75And90: between75And90,
    studentsBelow75: below75,
    lowAttendanceStudents: below75,
    students: studentSummaries
  };
};

/**
 * Upserts a Single Manual Attendance Record
 */
export const recordManualAttendance = async ({
  studentId,
  batchId,
  courseId = '',
  classDate,
  sessionId = null,
  status = 'Present',
  remarks = '',
  timeIn = '',
  user
}) => {
  if (!studentId || !batchId || !classDate) {
    throw new Error('studentId, batchId, and classDate are required');
  }

  const sObjectId = new mongoose.Types.ObjectId(studentId);
  const bObjectId = new mongoose.Types.ObjectId(batchId);
  const normalizedClassDate = normalizeDate(classDate);

  const batch = await Batch.findById(bObjectId).lean();
  if (!batch) throw new Error('Batch not found');

  const resolvedCourse = courseId || batch.course || 'General';
  const stdStatus = standardizeStatus(status);

  const updatedRecord = await Attendance.findOneAndUpdate(
    {
      student: sObjectId,
      batch: bObjectId,
      date: normalizedClassDate
    },
    {
      student: sObjectId,
      batch: bObjectId,
      course: resolvedCourse,
      subject: resolvedCourse,
      date: normalizedClassDate,
      session: sessionId ? new mongoose.Types.ObjectId(sessionId) : null,
      status: stdStatus,
      attendanceMode: 'MANUAL',
      remarks: remarks || '',
      timeIn: timeIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      markedBy: user?._id || sObjectId,
      updatedBy: user?._id || null
    },
    { new: true, upsert: true }
  ).populate('student', 'name email slaeId')
   .populate('batch', 'name course');

  return updatedRecord;
};

/**
 * High-performance Bulk Attendance Submission using MongoDB bulkWrite
 */
export const recordBulkAttendance = async ({
  batchId,
  courseId = '',
  classDate,
  sessionId = null,
  attendanceMode = 'MANUAL',
  records = [],
  user
}) => {
  if (!batchId || !classDate || !Array.isArray(records) || records.length === 0) {
    throw new Error('batchId, classDate, and non-empty records array are required');
  }

  const bObjectId = new mongoose.Types.ObjectId(batchId);
  const normalizedClassDate = normalizeDate(classDate);

  const batch = await Batch.findById(bObjectId).lean();
  if (!batch) throw new Error('Batch not found');

  const resolvedCourse = courseId || batch.course || 'General';
  const stdMode = standardizeMode(attendanceMode);
  const markerId = user?._id || bObjectId;
  const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bulkOps = [];
  const validationErrors = [];
  const validStudentIds = [];

  records.forEach((rec, index) => {
    if (!rec.studentId) {
      validationErrors.push({ index, error: 'Missing studentId' });
      return;
    }

    try {
      const sObjectId = new mongoose.Types.ObjectId(rec.studentId);
      const stdStatus = standardizeStatus(rec.status);
      validStudentIds.push(sObjectId);

      bulkOps.push({
        updateOne: {
          filter: {
            student: sObjectId,
            batch: bObjectId,
            date: normalizedClassDate
          },
          update: {
            $set: {
              student: sObjectId,
              batch: bObjectId,
              course: resolvedCourse,
              subject: resolvedCourse,
              date: normalizedClassDate,
              session: sessionId ? new mongoose.Types.ObjectId(sessionId) : null,
              status: stdStatus,
              attendanceMode: stdMode,
              remarks: rec.remarks || '',
              timeIn: rec.timeIn || currentTimeStr,
              markedBy: markerId,
              updatedBy: markerId
            }
          },
          upsert: true
        }
      });
    } catch (err) {
      validationErrors.push({ index, studentId: rec.studentId, error: err.message });
    }
  });

  let bulkResult = null;
  if (bulkOps.length > 0) {
    bulkResult = await Attendance.bulkWrite(bulkOps, { ordered: false });
  }

  return {
    success: true,
    totalSubmitted: records.length,
    successfulCount: (bulkResult?.upsertedCount || 0) + (bulkResult?.modifiedCount || 0) + (bulkResult?.matchedCount || 0),
    upsertedCount: bulkResult?.upsertedCount || 0,
    modifiedCount: bulkResult?.modifiedCount || 0,
    matchedCount: bulkResult?.matchedCount || 0,
    failedCount: validationErrors.length,
    validationErrors
  };
};
