import mongoose from 'mongoose';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Holiday from '../models/Holiday.js';

// Format YYYY-MM-DD
const formatDateISO = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toISOString().split('T')[0];
};

/**
 * Calculates dynamic attendance for multiple students in bulk (Pre-fetches holidays and session dates ONCE)
 * @param {Array<string|ObjectId>} studentIds 
 * @param {string} department 'Communication' | 'Aptitude' | 'Technical'
 * @returns {Promise<Map<string, Object>>} Map of studentId.toString() -> attendanceStats
 */
export const calculateBulkStudentsAttendance = async (studentIds, department) => {
  const statsMap = new Map();
  if (!studentIds || studentIds.length === 0) return statsMap;

  const objectStudentIds = studentIds.map(id => new mongoose.Types.ObjectId(id));
  const dept = department || 'Communication';
  const isComm = dept.toLowerCase().includes('comm');
  const isApti = dept.toLowerCase().includes('apti');

  const fixedTotalDays = isComm ? 80 : (isApti ? 120 : 100);

  // Parallelize all independent database pre-fetches for instant response
  const domainSubjectRegex = isComm ? /comm/i : isApti ? /apti/i : /tech/i;

  const [enrollments, holidays, sessions, attendanceLogs] = await Promise.all([
    Enrollment.find({
      studentId: { $in: objectStudentIds },
      department: dept,
      status: 'Active'
    }).populate('batchId', 'name startDate').lean(),
    Holiday.find().lean(),
    AttendanceSession.find({
      status: 'Active',
      $or: [{ subject: domainSubjectRegex }, { category: domainSubjectRegex }]
    }).select('createdAt').limit(100).lean(),
    Attendance.find({
      student: { $in: objectStudentIds },
      subject: domainSubjectRegex
    }).lean()
  ]);

  const enrollmentMap = new Map();
  (enrollments || []).forEach(e => {
    enrollmentMap.set(e.studentId.toString(), e);
  });

  const holidaySet = new Set();
  (holidays || []).forEach(h => {
    if (h.date) holidaySet.add(formatDateISO(h.date));
  });

  const domainScannedDates = new Set();
  (sessions || []).forEach(s => {
    const dStr = formatDateISO(s.createdAt);
    if (dStr) domainScannedDates.add(dStr);
  });

  (attendanceLogs || []).forEach(a => {
    const dStr = formatDateISO(a.date);
    if (dStr) domainScannedDates.add(dStr);
  });

  const studentLogsMap = new Map();
  (attendanceLogs || []).forEach(log => {
    const sId = log.student.toString();
    if (!studentLogsMap.has(sId)) {
      studentLogsMap.set(sId, []);
    }
    studentLogsMap.get(sId).push(log);
  });

  const todayStr = formatDateISO(new Date());

  // 5. Compute stats per student
  for (const rawId of studentIds) {
    const sId = rawId.toString();
    const enrollment = enrollmentMap.get(sId);
    
    let rawStartDate = enrollment?.startDate || enrollment?.createdAt || new Date();
    const startDateISO = formatDateISO(rawStartDate);

    // Fallback batch name
    const batchName = enrollment?.batchId?.name || 'Unassigned';

    const logs = studentLogsMap.get(sId) || [];
    
    // Count valid absences
    let absentCount = 0;

    // A. Count explicit Absent logs
    logs.forEach(log => {
      if (log.status === 'Absent') {
        const dStr = formatDateISO(log.date);
        if (dStr && dStr >= startDateISO) {
          const dObj = new Date(log.date);
          const dayOfWeek = dObj.getDay();
          // Exclude Saturday (6) and Sunday (0) and holidays
          if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dStr)) {
            absentCount++;
          }
        }
      }
    });

    // B. Calculate training day progress count
    let trainingDayCount = 0;
    if (startDateISO) {
      const cur = new Date(rawStartDate);
      cur.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (cur <= today) {
        const dStr = formatDateISO(cur);
        const dayOfWeek = cur.getDay();
        const isValidDay = dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dStr);
        if (isValidDay && domainScannedDates.has(dStr)) {
          trainingDayCount++;
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    if (trainingDayCount < 1) trainingDayCount = 1;

    // Fixed Denominator Attendance Percentage Calculation:
    // (fixedTotalDays - absentCount) / fixedTotalDays * 100
    const remainingDays = Math.max(0, fixedTotalDays - trainingDayCount);
    const earnedDays = fixedTotalDays - absentCount;
    const attendancePercent = parseFloat(Math.max(0, (earnedDays / fixedTotalDays) * 100).toFixed(2));
    const progressPercent = parseFloat(Math.min(100, (trainingDayCount / fixedTotalDays) * 100).toFixed(2));

    const startDateFormatted = rawStartDate ? new Date(rawStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    statsMap.set(sId, {
      department: dept,
      batchName,
      startDate: startDateFormatted,
      rawStartDate,
      trainingDay: trainingDayCount,
      totalTrainingDays: fixedTotalDays,
      presentCount: Math.max(0, trainingDayCount - absentCount),
      absentCount,
      remainingDays,
      attendancePercent,
      progressPercent,
      eligibleSessionsCount: fixedTotalDays,
      percentage: attendancePercent
    });
  }

  return statsMap;
};

/**
 * Calculates dynamic attendance stats for a single student
 */
export const calculateSingleStudentAttendance = async (studentId, department) => {
  const statsMap = await calculateBulkStudentsAttendance([studentId], department);
  return statsMap.get(studentId.toString()) || {
    department: department || 'Communication',
    batchName: 'N/A',
    startDate: 'N/A',
    rawStartDate: new Date(),
    trainingDay: 0,
    totalTrainingDays: department === 'Aptitude' ? 120 : 80,
    presentCount: 0,
    absentCount: 0,
    remainingDays: department === 'Aptitude' ? 120 : 80,
    attendancePercent: 100,
    progressPercent: 0,
    eligibleSessionsCount: department === 'Aptitude' ? 120 : 80,
    percentage: 100
  };
};
