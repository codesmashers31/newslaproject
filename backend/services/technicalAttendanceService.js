import mongoose from 'mongoose';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Holiday from '../models/Holiday.js';
import User from '../models/User.js';
import { attendanceDateKey as key, attendanceDayStart, attendanceWeekday, isAttendanceDayClosed } from '../utils/attendanceDate.js';

export const isTechnicalBatch = (batch) => !!batch && !/comm|apti|reasoning/i.test(batch.course || '');
const display = value => value ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
const percent = (a, b, empty = 100) => b > 0 ? Number((a / b * 100).toFixed(2)) : empty;

export const technicalWindow = (batch, enrollment = {}, baseline = null) => {
  const batchStart = key(batch?.startDate), batchEnd = key(batch?.endDate);
  if (!batchStart || !batchEnd || batchEnd < batchStart) return null;
  const starts = [batchStart, key(enrollment.startDate || enrollment.enrolledAt || enrollment.createdAt), key(baseline)].filter(Boolean);
  const ends = [batchEnd, key(enrollment.completedAt || enrollment.endDate)].filter(Boolean);
  return { start: starts.sort().at(-1), end: ends.sort()[0] };
};

// One record per student/batch/day, with the latest manual correction respected.
export const computeTechnicalBatchAttendance = ({ studentId, batch, enrollment, baseline, scans = [], records = [], holidays = [], now = new Date(), startDate, endDate }) => {
  const window = technicalWindow(batch, enrollment, baseline);
  const holidaySet = new Set(holidays.map(h => key(h.date)));
  const today = key(now);
  const valid = d => !!window && d >= window.start && d <= window.end &&
    (!startDate || d >= key(startDate)) && (!endDate || d <= key(endDate)) &&
    attendanceWeekday(d) !== 0 && attendanceWeekday(d) !== 6 && !holidaySet.has(d);
  const conducted = new Set(scans.filter(r => String(r.batch?._id || r.batch) === String(batch._id) &&
    String(r.attendanceMode).toUpperCase() === 'SCAN' && ['PRESENT', 'LATE'].includes(String(r.status).toUpperCase()))
    .map(r => key(r.date)).filter(d => d <= today && valid(d)));
  const byDate = new Map();
  records.filter(r => String(r.student?._id || r.student) === String(studentId) && String(r.batch?._id || r.batch) === String(batch._id))
    .sort((a, b) => new Date(a.updatedAt || a.createdAt || a.date) - new Date(b.updatedAt || b.createdAt || b.date))
    .forEach(r => { const d = key(r.date); if (conducted.has(d)) byDate.set(d, r); });
  const presentDates = [], absentDates = [], leaveDates = [], eligibleRecords = [];
  let pendingCount = 0;
  for (const d of [...conducted].sort()) {
    const rec = byDate.get(d);
    if (!rec && !isAttendanceDayClosed(d, now)) { pendingCount++; continue; }
    const status = String(rec?.status || 'Absent').toUpperCase();
    const detail = { date: d, display: display(d), mode: rec?.attendanceMode || 'MANUAL', batchId: batch._id };
    if (['PRESENT', 'LATE'].includes(status)) presentDates.push(detail);
    else if (['LEAVE', 'EXCUSED'].includes(status)) leaveDates.push(detail);
    else absentDates.push(detail);
    if (rec) eligibleRecords.push(rec);
  }
  const trainingDay = presentDates.length + absentDates.length + leaveDates.length;
  let remainingDays = 0, pendingScheduledDays = 0;
  if (window && window.start <= window.end) {
    for (let d = attendanceDayStart(window.start); key(d) <= window.end; d = new Date(d.getTime() + 86400000)) {
      const day = key(d);
      if (!valid(day)) continue;
      if (day > today) remainingDays++;
      else if (!isAttendanceDayClosed(day, now) && !conducted.has(day)) pendingScheduledDays++;
    }
  }
  // Future weekdays are provisional. Elapsed days without scans are excluded.
  const totalTrainingDays = conducted.size + remainingDays + pendingScheduledDays;
  return {
    department: 'Technical', batchId: batch._id, batchName: batch.name || 'Unassigned',
    startDate: display(window?.start), rawStartDate: window ? attendanceDayStart(window.start) : null,
    endDate: display(window?.end), rawEndDate: window ? attendanceDayStart(window.end) : null,
    configurationRequired: !window, trainingDay, totalTrainingDays, remainingDays, pendingCount,
    presentCount: presentDates.length, absentCount: absentDates.length, leaveCount: leaveDates.length,
    attendancePercent: percent(presentDates.length, trainingDay),
    percentage: percent(presentDates.length, trainingDay),
    progressPercent: percent(trainingDay, totalTrainingDays, 0), eligibleSessionsCount: trainingDay,
    totalClasses: trainingDay, attendancePercentage: percent(presentDates.length, trainingDay),
    presentDates, absentDates, leaveDates, records: eligibleRecords
  };
};

export const calculateTechnicalAttendance = async (studentIds, options = {}) => {
  const ids = studentIds.map(id => new mongoose.Types.ObjectId(id));
  const enrollmentQuery = { studentId: { $in: ids }, department: 'Technical', status: 'Active' };
  if (options.batchId) enrollmentQuery.batchId = new mongoose.Types.ObjectId(options.batchId);
  else if (options.batchIds) enrollmentQuery.batchId = { $in: options.batchIds.map(id => new mongoose.Types.ObjectId(id)) };
  const [enrollments, students, holidays] = await Promise.all([
    Enrollment.find(enrollmentQuery).populate('batchId', 'name course startDate endDate').lean(),
    User.find({ _id: { $in: ids } }).select('attendanceStartDate').lean(),
    Holiday.find().lean()
  ]);
  const batchIds = [...new Map(enrollments.filter(e => e.batchId?._id).map(e => [String(e.batchId._id), e.batchId._id])).values()];
  const [scans, records] = await Promise.all([
    Attendance.find({ batch: { $in: batchIds }, attendanceMode: { $in: ['SCAN', 'Scan'] }, status: { $in: ['Present', 'Late', 'PRESENT'] } })
      .select('batch date status attendanceMode')
      .lean(),
    Attendance.find({ batch: { $in: batchIds }, student: { $in: ids } })
      .select('batch student date status attendanceMode updatedAt createdAt')
      .lean()
  ]);
  const result = new Map();
  for (const id of ids) {
    const baseline = students.find(s => String(s._id) === String(id))?.attendanceStartDate;
    const batches = enrollments.filter(e => String(e.studentId) === String(id) && e.batchId?._id).map(enrollment =>
      computeTechnicalBatchAttendance({ studentId: id, batch: enrollment.batchId, enrollment, baseline, scans, records, holidays, ...options }));
    const sum = field => batches.reduce((total, b) => total + b[field], 0);
    const trainingDay = sum('trainingDay'), presentCount = sum('presentCount'), totalTrainingDays = sum('totalTrainingDays');
    result.set(String(id), { department: 'Technical', batches,
      batchName: batches.map(b => b.batchName).join(', ') || 'Unassigned',
      startDate: batches[0]?.startDate || display(baseline), rawStartDate: batches[0]?.rawStartDate || baseline || null,
      configurationRequired: !batches.length || batches.some(b => b.configurationRequired),
      trainingDay, totalClasses: trainingDay, totalApplicableClasses: trainingDay, totalTrainingDays, presentCount,
      absentCount: sum('absentCount'), leaveCount: sum('leaveCount'), remainingDays: sum('remainingDays'), pendingCount: sum('pendingCount'),
      attendancePercent: percent(presentCount, trainingDay), attendancePercentage: percent(presentCount, trainingDay), percentage: percent(presentCount, trainingDay),
      progressPercent: percent(trainingDay, totalTrainingDays, 0), eligibleSessionsCount: trainingDay,
      presentDates: batches.flatMap(b => b.presentDates), absentDates: batches.flatMap(b => b.absentDates), leaveDates: batches.flatMap(b => b.leaveDates),
      records: batches.flatMap(b => b.records)
    });
  }
  return result;
};
