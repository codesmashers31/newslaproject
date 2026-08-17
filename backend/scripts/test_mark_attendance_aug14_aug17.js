import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import { calculateDynamicAttendance } from '../utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function markAndVerify() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected...');

  const meena = await User.findOne({ name: /Meena/i });
  const trainer = await User.findOne({ role: /Trainer/i });
  const batch = await Batch.findOne({ name: 'Batch 6' });

  console.log('Meena ID:', meena._id, 'Batch ID:', batch._id);

  // Mark Meena Absent on Aug 14 & Aug 17 for Aptitude and Communication
  const dates = [new Date('2026-08-14'), new Date('2026-08-17')];

  for (const d of dates) {
    d.setHours(0, 0, 0, 0);

    // Communication
    await Attendance.findOneAndUpdate(
      { student: meena._id, batch: batch._id, date: d, subject: 'Communication' },
      { status: 'Absent', markedBy: trainer._id },
      { upsert: true, new: true }
    );

    // Aptitude
    await Attendance.findOneAndUpdate(
      { student: meena._id, batch: batch._id, date: d, subject: 'Aptitude' },
      { status: 'Absent', markedBy: trainer._id },
      { upsert: true, new: true }
    );
  }

  console.log('✅ Marked Meena R Absent on Aug 14 & Aug 17 for Communication & Aptitude.');

  const commStats = await calculateDynamicAttendance(meena._id, 'Communication');
  console.log('\nUpdated Communication Stats:', {
    presentCount: commStats.presentCount,
    absentCount: commStats.absentCount,
    attendancePercent: commStats.attendancePercent
  });

  const aptiStats = await calculateDynamicAttendance(meena._id, 'Aptitude');
  console.log('Updated Aptitude Stats:', {
    presentCount: aptiStats.presentCount,
    absentCount: aptiStats.absentCount,
    attendancePercent: aptiStats.attendancePercent
  });

  await mongoose.disconnect();
}

markAndVerify().catch(console.error);
