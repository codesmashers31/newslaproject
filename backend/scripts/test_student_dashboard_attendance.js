import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { calculateDynamicAttendance } from '../utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyStudentAttendanceStats() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected...');

  const student = await User.findOne({ email: 'meena@sla.com' });
  if (!student) {
    console.log('Meena R not found');
    return;
  }

  const commStats = await calculateDynamicAttendance(student._id, 'Communication');
  const aptiStats = await calculateDynamicAttendance(student._id, 'Aptitude');

  console.log('--- Meena R Communication Attendance Stats ---', {
    presentCount: commStats.presentCount,
    absentCount: commStats.absentCount,
    totalTrainingDays: commStats.totalTrainingDays,
    eligibleSessionsCount: commStats.eligibleSessionsCount,
    attendancePercent: commStats.attendancePercent
  });

  console.log('--- Meena R Aptitude Attendance Stats ---', {
    presentCount: aptiStats.presentCount,
    absentCount: aptiStats.absentCount,
    totalTrainingDays: aptiStats.totalTrainingDays,
    eligibleSessionsCount: aptiStats.eligibleSessionsCount,
    attendancePercent: aptiStats.attendancePercent
  });

  await mongoose.disconnect();
}

verifyStudentAttendanceStats().catch(console.error);
