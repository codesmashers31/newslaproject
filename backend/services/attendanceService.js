import { attendanceDateKey as formatDateISO, attendanceDayStart, attendanceWeekday, isAttendanceDayClosed } from '../utils/attendanceDate.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Holiday from '../models/Holiday.js';
import { calculateTechnicalAttendance } from './technicalAttendanceService.js';

/**
 * Calculates dynamic attendance for multiple students in bulk based on batch-conducted class dates.
 * Business Rule:
 * If on a particular day NO ONE scanned or attended for the batch, that day is a Batch Leave / Off-day.
 * Only dates with actual conducted class activity (sessions or student check-ins) are counted as training days.
 * 
 * @param {Array<string|ObjectId>} studentIds 
 * @param {string} department 'Communication' | 'Aptitude' | 'Technical'
 * @returns {Promise<Map<string, Object>>} Map of studentId.toString() -> attendanceStats
 */
export const calculateBulkStudentsAttendance = async (studentIds, department, options = {}) => {
  const statsMap = new Map();
  if (!studentIds || studentIds.length === 0) return statsMap;
  if (!department || department === 'Technical') return calculateTechnicalAttendance(studentIds, options);

  const objectStudentIds = studentIds.map(id => new mongoose.Types.ObjectId(id));
  const dept = department || 'Technical';
  const isComm = dept.toLowerCase().includes('comm');
  const isApti = dept.toLowerCase().includes('apti');

  const fixedTotalDays = isComm ? 80 : (isApti ? 120 : 80);
  const domainSubjectRegex = isComm ? /comm/i : isApti ? /apti/i : /tech/i;

  // 1. Fetch active enrollments for target students in this department
  const enrollments = await Enrollment.find({
    studentId: { $in: objectStudentIds },
    department: dept,
    status: 'Active'
  }).populate('batchId', 'name startDate endDate startTime endTime schedule').lean();

  const enrollmentMap = new Map();
  const batchIdList = [];
  (enrollments || []).forEach(e => {
    enrollmentMap.set(e.studentId.toString(), e);
    if (e.batchId?._id) {
      batchIdList.push(e.batchId._id);
    }
  });

  // 2. Fetch holidays, sessions, and attendance logs concurrently
  const [holidays, sessions, allBatchAttendance, studentAttendanceLogs, studentBaselines] = await Promise.all([
    Holiday.find().lean(),
    AttendanceSession.find({
      $or: [
        { batch: { $in: batchIdList } },
        { subject: domainSubjectRegex },
        { category: domainSubjectRegex }
      ]
    }).select('batch createdAt').lean(),
    Attendance.find({
      $or: [
        { batch: { $in: batchIdList } },
        { subject: domainSubjectRegex },
        { course: domainSubjectRegex }
      ],
      status: { $in: ['Present', 'Late'] }
    }).select('batch subject date status student').lean(),
    Attendance.find({
      student: { $in: objectStudentIds },
      $or: [
        { subject: domainSubjectRegex },
        { course: domainSubjectRegex },
        { batch: { $in: batchIdList } }
      ]
    }).select('student date status subject course batch createdAt').lean(),
    User.find({ _id: { $in: objectStudentIds } }).select('attendanceStartDate').lean()
  ]);
  const baselineMap = new Map(studentBaselines.map(student => [String(student._id), student.attendanceStartDate]));

  const holidaySet = new Set();
  (holidays || []).forEach(h => {
    if (h.date) holidaySet.add(formatDateISO(h.date));
  });

  // 3. Build conducted class dates per batch and domain
  // A date is conducted for a batch if at least one QR session was started OR at least one student checked in
  const batchConductedDatesMap = new Map();
  const domainConductedDates = new Set();

  (sessions || []).forEach(s => {
    const dStr = formatDateISO(s.createdAt);
    if (dStr) {
      domainConductedDates.add(dStr);
      if (s.batch) {
        const bId = s.batch.toString();
        if (!batchConductedDatesMap.has(bId)) batchConductedDatesMap.set(bId, new Set());
        batchConductedDatesMap.get(bId).add(dStr);
      }
    }
  });

  (allBatchAttendance || []).forEach(a => {
    const dStr = formatDateISO(a.date);
    if (dStr) {
      domainConductedDates.add(dStr);
      if (a.batch) {
        const bId = a.batch.toString();
        if (!batchConductedDatesMap.has(bId)) batchConductedDatesMap.set(bId, new Set());
        batchConductedDatesMap.get(bId).add(dStr);
      }
    }
  });

  // 4. Group student attendance by studentId
  const studentLogsMap = new Map();
  (studentAttendanceLogs || []).forEach(log => {
    const sId = log.student.toString();
    if (!studentLogsMap.has(sId)) {
      studentLogsMap.set(sId, []);
    }
    studentLogsMap.get(sId).push(log);
  });

  const now = new Date();
  const todayStr = formatDateISO(now);

  // 5. Compute stats per student
  for (const rawId of studentIds) {
    const sId = rawId.toString();
    const enrollment = enrollmentMap.get(sId);
    
    let rawStartDate = enrollment?.startDate || baselineMap.get(sId) || enrollment?.enrolledAt || enrollment?.createdAt || new Date();
    const rawEndDate = enrollment?.completedAt || enrollment?.endDate || null;
    const startDateISO = formatDateISO(rawStartDate);
    const endDateISO = rawEndDate ? formatDateISO(rawEndDate) : todayStr;

    // Fallback batch name
    const batchName = enrollment?.batchId?.name || 'Unassigned';
    const batchIdStr = enrollment?.batchId?._id ? enrollment.batchId._id.toString() : null;

    // Determine conducted dates for this student's batch (or fallback to domain conducted dates)
    const batchDatesSet = (batchIdStr && batchConductedDatesMap.has(batchIdStr))
      ? batchConductedDatesMap.get(batchIdStr)
      : domainConductedDates;

    // Student's personal attendance map
    const studentLogs = studentLogsMap.get(sId) || [];
    const studentDayStatusMap = new Map();
    studentLogs.forEach(log => {
      const dStr = formatDateISO(log.date);
      if (dStr) {
        studentDayStatusMap.set(dStr, log.status);
      }
    });

    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let pendingCount = 0;
    let eligibleTrainingDays = 0;

    const presentDates = [];
    const absentDates = [];
    const leaveDates = [];

    // Filter conducted dates that fall within the student's active enrollment window
    const eligibleConductedDates = Array.from(batchDatesSet).filter(dStr => {
      if (dStr < startDateISO) return false;
      if (dStr > endDateISO) return false;
      if (dStr > todayStr) return false;
      if (holidaySet.has(dStr)) return false;
      const dayOfWeek = attendanceWeekday(dStr);
      if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Exclude Sat/Sun
      return true;
    }).sort();

    for (const dStr of eligibleConductedDates) {
      const isToday = (dStr === todayStr);
      const isClosed = isAttendanceDayClosed(dStr, now);
      const status = studentDayStatusMap.get(dStr);

      if (status === 'Present' || status === 'Late') {
        presentCount++;
        eligibleTrainingDays++;
        presentDates.push(dStr);
      } else if (status === 'Leave' || status === 'Excused') {
        leaveCount++;
        eligibleTrainingDays++;
        leaveDates.push(dStr);
      } else if (status === 'Absent') {
        absentCount++;
        eligibleTrainingDays++;
        absentDates.push(dStr);
      } else {
        // No log found for this conducted date
        if (isToday && !isClosed) {
          // Today's class is ongoing / pending check-in
          pendingCount++;
        } else {
          // Class is closed and student was absent
          absentCount++;
          eligibleTrainingDays++;
          absentDates.push(dStr);
        }
      }
    }

    const trainingDay = eligibleTrainingDays;
    const attendancePercent = trainingDay > 0 
      ? Math.round((presentCount / trainingDay) * 100) 
      : 100;

    const progressPercent = fixedTotalDays > 0 
      ? Math.min(100, Math.round((trainingDay / fixedTotalDays) * 100)) 
      : 0;

    const remainingDays = Math.max(0, fixedTotalDays - trainingDay);

    statsMap.set(sId, {
      department: dept,
      batchName,
      startDate: startDateISO,
      endDate: endDateISO,
      trainingDay,
      totalClasses: trainingDay,
      totalApplicableClasses: trainingDay,
      totalTrainingDays: fixedTotalDays,
      presentCount,
      absentCount,
      leaveCount,
      pendingCount,
      remainingDays,
      attendancePercent,
      attendancePercentage: attendancePercent,
      progressPercent,
      presentDates,
      absentDates,
      leaveDates,
      eligibleSessionsCount: trainingDay
    });
  }

  return statsMap;
};

export const calculateStudentAttendanceStats = async (studentId, department) => {
  const statsMap = await calculateBulkStudentsAttendance([studentId], department);
  return statsMap.get(studentId.toString()) || {
    department,
    trainingDay: 1,
    totalTrainingDays: department === 'Aptitude' ? 120 : 80,
    presentCount: 0,
    absentCount: 0,
    leaveCount: 0,
    attendancePercent: 100,
    attendancePercentage: 100,
    progressPercent: 0,
    remainingDays: department === 'Aptitude' ? 120 : 80
  };
};

export const calculateSingleStudentAttendance = calculateStudentAttendanceStats;
