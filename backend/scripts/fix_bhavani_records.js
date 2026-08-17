import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixBhavaniRecords() {
  console.log('========================================================================');
  console.log('         CLEANING UP BHAVANI D ATTENDANCE RECORDS FOR 2026-08-17        ');
  console.log('========================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const student = await User.findOne({ email: 'eid_24_002791@lcp.com' });
  if (!student) {
    console.log('Student BHAVANI D not found!');
    await mongoose.disconnect();
    return;
  }

  const startOfDay = new Date('2026-08-17');
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date('2026-08-17');
  endOfDay.setHours(23,59,59,999);

  // Delete all fragmented/duplicate records for BHAVANI D on 2026-08-17
  await Attendance.deleteMany({
    student: student._id,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  // Re-create single normalized Present record for Aptitude and Communication as marked by trainer
  const aptiBatchId = new mongoose.Types.ObjectId('6a7f0f28f904e4baf4109008'); // Batch 6 Aptitude
  const commBatchId = new mongoose.Types.ObjectId('6a7f0f27f904e4baf4109002'); // Batch 6 Communication

  await Attendance.create({
    student: student._id,
    batch: aptiBatchId,
    scannedBatch: aptiBatchId,
    date: startOfDay,
    subject: 'Aptitude',
    status: 'Present',
    timeIn: '08:04 PM',
    markedBy: student._id,
    remarks: 'QR Scanned & Verified'
  });

  await Attendance.create({
    student: student._id,
    batch: commBatchId,
    scannedBatch: commBatchId,
    date: startOfDay,
    subject: 'Communication',
    status: 'Present',
    timeIn: '08:04 PM',
    markedBy: student._id,
    remarks: 'QR Scanned & Verified'
  });

  console.log('✅ BHAVANI D attendance records successfully normalized to PRESENT for 2026-08-17!');

  await mongoose.disconnect();
}

fixBhavaniRecords().catch(console.error);
