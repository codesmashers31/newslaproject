import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import { calculateDynamicAttendance } from '../utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkMeena() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  const student = await User.findOne({ name: /Meena/i });
  if (!student) {
    console.log('Student Meena not found');
    return;
  }

  console.log('Student ID:', student._id.toString(), 'Name:', student.name, 'createdAt:', student.createdAt);

  const enrollments = await Enrollment.find({ studentId: student._id }).populate('batchId').lean();
  console.log('\n--- ENROLLMENTS ---');
  enrollments.forEach(e => {
    console.log(`Dept: ${e.department} | Batch: ${e.batchId?.name} | Course: ${e.course} | Status: ${e.status} | startDate: ${e.startDate}`);
  });

  const attendances = await Attendance.find({ student: student._id }).populate('batch').sort({ date: -1 }).lean();
  console.log('\n--- ATTENDANCE RECORDS ---');
  attendances.forEach(a => {
    console.log(`Date: ${new Date(a.date).toISOString().split('T')[0]} | Subject: "${a.subject}" | Status: "${a.status}" | Batch: ${a.batch?.name} (${a.batch?.course})`);
  });

  console.log('\n--- CALCULATED STATS ---');
  const commStats = await calculateDynamicAttendance(student._id, 'Communication');
  console.log('Communication Stats:', commStats);

  const aptiStats = await calculateDynamicAttendance(student._id, 'Aptitude');
  console.log('Aptitude Stats:', aptiStats);

  await mongoose.disconnect();
}

checkMeena().catch(console.error);
