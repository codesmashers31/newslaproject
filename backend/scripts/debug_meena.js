import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Enrollment from '../models/Enrollment.js';
import { calculateDynamicAttendance } from '../utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function debugMeena() {
  await mongoose.connect(process.env.MONGODB_URI);

  const meena = await User.findOne({ email: 'meena@sla.com' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Insert explicit Absent record for Aptitude
  await Attendance.findOneAndUpdate(
    { student: meena._id, subject: 'Aptitude & Reasoning', date: today },
    { status: 'Absent', remarks: 'Test Absent' },
    { upsert: true, new: true }
  );

  console.log('Inserted Absent record for Meena in Aptitude & Reasoning');

  const aptiStats = await calculateDynamicAttendance(meena._id, 'Aptitude');
  console.log('--- Aptitude Stats after Absent ---', aptiStats);

  const commStats = await calculateDynamicAttendance(meena._id, 'Communication');
  console.log('--- Communication Stats ---', commStats);

  await mongoose.disconnect();
}

debugMeena().catch(console.error);
