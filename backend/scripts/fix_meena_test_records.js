import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanupMeenaTestRecords() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected...');

  const student = await User.findOne({ name: /Meena/i });
  if (!student) {
    console.log('Student Meena R not found');
    return;
  }

  const res = await Attendance.deleteMany({ student: student._id });
  console.log(`Cleaned up ${res.deletedCount} attendance records for Meena R.`);

  await mongoose.disconnect();
}

cleanupMeenaTestRecords().catch(console.error);
