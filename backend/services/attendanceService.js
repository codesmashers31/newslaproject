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
 * Calculates dynamic attendance for multiple students in bulk based on batch-conducted class dates.
 * Business Rule:
 * If on a particular day NO ONE scanned or attended for the batch, that day is a Batch Leave / Off-day.
 * Only dates with actual conducted class activity (sessions or student check-ins) are counted as training days.
 * 
 * @param {Array<string|ObjectId>} studentIds 
 * @param {string} department 'Communication' | 'Aptitude' | 'Technical'
 * @returns {Promise<Map<string, Object>>} Map of studentId.toString() -> attendanceStats
 */
export const calculateBulkStudentsAttendance = async (studentIds, department) => {
  const statsMap = new Map();
  if (!studentIds || studentIds.length === 0) return statsMap;

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
  const [holidays, sessions, allBatchAttendance, studentAttendanceLogs] = await Promise.all([
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
    }).lean()
  ]);

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

  const todayStr = formatDateISO(new Date());

  // 5. Compute stats per student
  for (const rawId of studentIds) {
    const sId = rawId.toString();
    const enrollment = enrollmentMap.get(sId);
    
    let rawStartDate = enrollment?.startDate || enrollment?.batchId?.startDate || enrollment?.createdAt || new Date();
    const rawEndDate = enrollment?.endDate || enrollment?.batchId?.endDate || null;
    const startDateISO = formatDateISO(rawStartDate);
    const endDateISO = rawEndDate ? formatDateISO(rawEndDate) : todayStr;

    // Fallback batch name
    const batchName = enrollment?.batchId?.name || 'Unassigned';
    const batchIdStr = enrollment?.batchId?._id ? enrollment.batchId._id.toString() : null;

    // Determine conducted dates for this student's batch (or fallback to domain conducted dates)
    const batchDatesSet = (batchIdStr && batchConductedDatesMap.has(batchIdStr))
      ? batchConductedDatesMap.get(batchIdStr)
      : domainConductedDates;

    // Filter conducted dates that fall between student's startDate and today (and <= batch endDate)
    const relevantConductedDates = Array.from(batchDatesSet).filter(dStr => {
      if (dStr < startDateISO) return false;
      if (dStr > todayStr) return false;
      if (rawEndDate && dStr > endDateISO) return false;
      if (holidaySet.has(dStr)) return false;
      
      const dObj = new Date(dStr);
      const dayOfWeek = dObj.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Exclude weekends
      return true;
    });

    const logs = studentLogsMap.get(sId) || [];
    
    // Set of dates this student was logged Present / Late
    const studentPresentDates = new Set();
    const studentAbsentDates = new Set();

    logs.forEach(log => {
      const dStr = formatDateISO(log.date);
      if (dStr && dStr >= startDateISO && dStr <= todayStr) {
        if (log.status === 'Present' || log.status === 'Late') {
          studentPresentDates.add(dStr);
        } else if (log.status === 'Absent') {
          studentAbsentDates.add(dStr);
        }
      }
    });

    // If conducted class days were recorded, trainingDay = number of conducted dates
    // If no specific class conducted logs yet in DB, default to working days between start date and today
    let trainingDayCount = 0;
    let presentCount = 0;
    let absentCount = 0;

    if (relevantConductedDates.length > 0) {
      trainingDayCount = relevantConductedDates.length;
      relevantConductedDates.forEach(dStr => {
        if (studentPresentDates.has(dStr)) {
          presentCount++;
        } else {
          absentCount++;
        }
      });
    } else {
      // Fallback if no batch scans logged yet: count elapsed calendar weekdays
      let cur = new Date(rawStartDate);
      cur.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (cur <= today) {
        const dStr = formatDateISO(cur);
        const dayOfWeek = cur.getDay();
        const isValidDay = dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dStr);
        if (isValidDay) {
          trainingDayCount++;
          if (studentPresentDates.has(dStr)) {
            presentCount++;
          } else if (studentAbsentDates.has(dStr)) {
            absentCount++;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
      const totalLogged = presentCount + absentCount;
      if (trainingDayCount > totalLogged) {
        absentCount += (trainingDayCount - totalLogged);
      }
    }

    const remainingDays = Math.max(0, fixedTotalDays - trainingDayCount);
    // Real-world Attendance % = (presentCount / trainingDayCount) * 100
    // If no training days held yet for student, default to 100%
    const attendancePercent = trainingDayCount > 0
      ? parseFloat(((presentCount / trainingDayCount) * 100).toFixed(2))
      : 100;
    const progressPercent = parseFloat(Math.min(100, (trainingDayCount / fixedTotalDays) * 100).toFixed(2));

    const startDateFormatted = rawStartDate ? new Date(rawStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    statsMap.set(sId, {
      department: dept,
      batchName,
      startDate: startDateFormatted,
      rawStartDate,
      trainingDay: trainingDayCount,
      totalTrainingDays: fixedTotalDays,
      presentCount,
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
    department: department || 'Technical',
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
