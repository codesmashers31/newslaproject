import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspectMeenaAttendance() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected...');

  const student = await User.findOne({ name: /Meena/i });
  if (!student) {
    console.log('Student Meena R not found');
    return;
  }

  console.log('Found Student Meena R:', { id: student._id, name: student.name, email: student.email });

  const records = await Attendance.find({ student: student._id })
    .populate('batch', 'name course')
    .sort({ date: -1 })
    .lean();

  console.log(`Total Attendance Records for Meena R: ${records.length}`);
  records.forEach((r, idx) => {
    console.log(`[Record ${idx + 1}] Date: ${new Date(r.date).toISOString().split('T')[0]} | Subject: "${r.subject}" | Status: "${r.status}" | Batch: "${r.batch?.name || r.batch}" (${r.batch?.course})`);
  });

  await mongoose.disconnect();
}

inspectMeenaAttendance().catch(console.error);
