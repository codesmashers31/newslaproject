import mongoose from 'mongoose';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Holiday from '../models/Holiday.js';

// Get current date string (YYYY-MM-DD) and time in Asia/Kolkata timezone
export const getKolkataDateAndTime = () => {
  const now = new Date();
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

    // Rule 1: Skip Weekends (Saturday & Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log(`[6PM Cron] Weekend (${dateISO}) - Skipped auto-close.`);
      return { status: 'skipped', reason: 'weekend' };
    }

    // Rule 2: Skip Institute Holidays
    const isHoliday = await Holiday.findOne({
      date: {
        $gte: new Date(`${dateISO}T00:00:00.000Z`),
        $lte: new Date(`${dateISO}T23:59:59.999Z`)
      }
    });

    if (isHoliday) {
      console.log(`[6PM Cron] Institute Holiday (${dateISO}) - Skipped auto-close.`);
      return { status: 'skipped', reason: 'holiday' };
    }

    const todayDate = new Date(`${dateISO}T00:00:00.000Z`);

    // Find admin user to attribute auto-close records
    let systemUser = await User.findOne({ role: { $in: ['Admin', 'Super Admin'] } });
    const systemUserId = systemUser ? systemUser._id : new mongoose.Types.ObjectId();

    const departments = ['Communication', 'Aptitude', 'Technical'];
    let autoAbsentCount = 0;

    for (const dept of departments) {
      const subjectRegex = new RegExp(dept, 'i');

      // Rule 3: No-Training-Day Protection
      // Check if at least 1 student scanned or 1 session was active for this department today
      const hasScans = await Attendance.findOne({
        subject: subjectRegex,
        date: { $gte: todayDate, $lte: new Date(`${dateISO}T23:59:59.999Z`) },
        status: { $in: ['Present', 'Late'] }
      });

      const hasSession = await AttendanceSession.findOne({
        $or: [{ subject: subjectRegex }, { category: subjectRegex }],
        createdAt: { $gte: todayDate, $lte: new Date(`${dateISO}T23:59:59.999Z`) }
      });

      if (!hasScans && !hasSession) {
        console.log(`[6PM Cron] No Training Day detected for ${dept} on ${dateISO} - No auto absences created.`);
        continue; // Skip department
      }

      // Find all active enrollments for this department valid on today's date
      const enrollments = await Enrollment.find({
        department: dept,
        status: 'Active',
        $or: [
          { startDate: null },
          { startDate: { $lte: new Date(`${dateISO}T23:59:59.999Z`) } }
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
        date: { $gte: todayDate, $lte: new Date(`${dateISO}T23:59:59.999Z`) }
      }).lean();

      const scannedStudentSet = new Set(existingLogs.map(l => l.student.toString()));

      const absentBulkOps = [];
      enrollments.forEach(e => {
        const sId = e.studentId.toString();
        if (!scannedStudentSet.has(sId)) {
          scannedStudentSet.add(sId);
          absentBulkOps.push({
            updateOne: {
              filter: {
                student: e.studentId,
                batch: e.batchId,
                date: todayDate,
                subject: dept
              },
              update: {
                $setOnInsert: {
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
let hasRunToday = false;

export const initAttendanceCronJob = () => {
  console.log('⏰ Initialized 6:00 PM IST Attendance Auto-Close Scheduler.');

  setInterval(async () => {
    const { hours, minutes, dateISO } = getKolkataDateAndTime();

    // Reset flag at midnight IST (00:00)
    if (hours === 0 && minutes === 0) {
      hasRunToday = false;
    }

    // Trigger auto-close at 6:00 PM IST (18:00)
    if (hours === 18 && minutes === 0 && !hasRunToday) {
      hasRunToday = true;
      console.log(`⏰ Triggering 6:00 PM IST Attendance Auto-Close for ${dateISO}...`);
      await autoCloseAttendanceForToday();
    }
  }, 60000); // Check every 60 seconds
};
