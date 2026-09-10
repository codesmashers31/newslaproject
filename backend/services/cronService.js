import { attendanceDayStart, attendanceDayEnd, attendanceDayRange, attendanceDateKey, isAttendanceDayClosed } from '../utils/attendanceDate.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Holiday from '../models/Holiday.js';

// Get current date string (YYYY-MM-DD) and time in Asia/Kolkata timezone
export const getKolkataDateAndTime = (now = new Date()) => {
  const kolkataStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const kolkataDate = new Date(kolkataStr);

  const year = kolkataDate.getFullYear();
  const month = String(kolkataDate.getMonth() + 1).padStart(2, '0');
  const day = String(kolkataDate.getDate()).padStart(2, '0');
  const dateISO = `${year}-${month}-${day}`;

  const hours = kolkataDate.getHours();
  const minutes = kolkataDate.getMinutes();
  const dayOfWeek = kolkataDate.getDay(); // 0 = Sun, 6 = Sat

  return { kolkataDate, dateISO, hours, minutes, dayOfWeek };
};

/**
 * Automatically closes attendance sessions and marks absent for un-scanned enrolled students at 6:00 PM IST
 */
export const autoCloseAttendanceForToday = async () => {
  try {
    const { dateISO, dayOfWeek } = getKolkataDateAndTime();

    if (!isAttendanceDayClosed(dateISO)) return { status: 'skipped', reason: 'before-cutoff' };

    // Rule 1: Skip Weekends (Saturday & Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`[6PM Cron] Weekend (${dateISO}) - Skipped auto-close.`);
      return { status: 'skipped', reason: 'weekend' };
    }

    // Rule 2: Skip Institute Holidays
    const isHoliday = await Holiday.findOne({
      date: {
        $gte: attendanceDayStart(dateISO),
        $lte: attendanceDayEnd(dateISO)
      }
    });

    if (isHoliday) {
      console.log(`[6PM Cron] Institute Holiday (${dateISO}) - Skipped auto-close.`);
      return { status: 'skipped', reason: 'holiday' };
    }

    const todayDate = attendanceDayStart(dateISO);

    // Find admin user to attribute auto-close records
    let systemUser = await User.findOne({ role: { $in: ['Admin', 'Super Admin'] } });
    const systemUserId = systemUser ? systemUser._id : new mongoose.Types.ObjectId();

    const departments = ['Communication', 'Aptitude', 'Technical'];
    let autoAbsentCount = 0;

    for (const dept of departments) {
      const subjectRegex = new RegExp(dept, 'i');

      // Rule 3: No-Training-Day Protection
      // Check if at least 1 student scanned or 1 session was active for this department today
      const scans = await Attendance.find({
        subject: subjectRegex,
        date: { $gte: todayDate, $lte: attendanceDayEnd(dateISO) },
        status: { $in: ['Present', 'Late'] }
      }).select('batch').lean();

      const sessions = await AttendanceSession.find({
        $or: [{ subject: subjectRegex }, { category: subjectRegex }],
        createdAt: { $gte: todayDate, $lte: attendanceDayEnd(dateISO) }
      }).select('batch').lean();

      if (scans.length === 0 && sessions.length === 0) {
        console.log(`[6PM Cron] No Training Day detected for ${dept} on ${dateISO} - No auto absences created.`);
        continue; // Skip department
      }

      const conductedBatches = [...new Set([...scans, ...sessions].filter(row => row.batch).map(row => String(row.batch)))];

      // Only students in batches that actually held training are eligible.
      const enrollments = await Enrollment.find({
        department: dept,
        batchId: { $in: conductedBatches },
        status: 'Active',
        $or: [
          { startDate: null },
          { startDate: { $lte: attendanceDayEnd(dateISO) } }
        ],
        $and: [
          {
            $or: [
              { completedAt: null },
              { completedAt: { $gte: todayDate } }
            ]
          }
        ]
      }).lean();

      if (enrollments.length === 0) continue;

      const studentIds = enrollments.map(e => e.studentId);

      // Fetch existing attendance logs for today
      const existingLogs = await Attendance.find({
        student: { $in: studentIds },
        subject: subjectRegex,
        date: { $gte: todayDate, $lte: attendanceDayEnd(dateISO) }
      }).lean();

      const scannedStudentSet = new Set(existingLogs.map(l => l.student.toString()));

      const absentBulkOps = [];
      enrollments.forEach(e => {
        const sId = e.studentId.toString();
        const enrolledOn = attendanceDateKey(e.startDate || e.enrolledAt || e.createdAt);
        if (enrolledOn && enrolledOn > dateISO) return;
        if (!scannedStudentSet.has(sId)) {
          scannedStudentSet.add(sId);
          absentBulkOps.push({
            updateOne: {
              filter: {
                student: e.studentId,
                batch: e.batchId,
                date: attendanceDayRange(todayDate),
                subject: dept
              },
              update: {
                $setOnInsert: {
                  date: todayDate,
                  course: dept,
                  attendanceMode: 'MANUAL',
                  status: 'Absent',
                  remarks: 'Auto-closed at 6:00 PM IST',
                  markedBy: systemUserId
                }
              },
              upsert: true
            }
          });
        }
      });

      if (absentBulkOps.length > 0) {
        const res = await Attendance.bulkWrite(absentBulkOps, { ordered: false });
        autoAbsentCount += (res.upsertedCount || 0);
      }
    }

    await AttendanceSession.updateMany({
      isActive: true,
      startTime: { $lte: new Date(`${dateISO}T18:00:00+05:30`) }
    }, { $set: { isActive: false } });

    console.log(`[6PM Cron] Successfully closed attendance for ${dateISO}. Auto-absent records logged: ${autoAbsentCount}`);
    return { status: 'success', dateISO, autoAbsentCount };
  } catch (error) {
    console.error('[6PM Cron Error]:', error);
    return { status: 'error', error: error.message };
  }
};

/**
 * Initializes minute-based scheduler for 6:00 PM IST execution
 */
// Same-day catch-up after restart; writes are insert-only and safe to retry.
export const createAttendanceSchedulerTick = (run = autoCloseAttendanceForToday, clock = getKolkataDateAndTime) => {
  let completedDate = null;
  let running = false;
  return async () => {
    const { hours, dateISO } = clock();
    if (running || hours < 18 || completedDate === dateISO) return;
    running = true;
    try {
      const result = await run();
      if (result?.status === 'success' || result?.status === 'skipped') completedDate = dateISO;
    } catch (error) {
      console.error('[6PM Cron Retry]:', error.message);
    } finally {
      running = false;
    }
  };
};

export const initAttendanceCronJob = () => {
  console.log('Initialized 6:00 PM IST Attendance Auto-Close Scheduler.');
  const tick = createAttendanceSchedulerTick();
  void tick();
  return setInterval(tick, 60000);
};
