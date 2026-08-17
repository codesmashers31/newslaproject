import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspectBhavaniScan() {
  console.log('========================================================================');
  console.log('         BHAVANI D QR SCAN & ATTENDANCE RECORD INSPECTION              ');
  console.log('========================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Find User document
  const student = await User.findOne({ 
    $or: [
      { name: /BHAVANI/i },
      { email: 'eid_24_002791@lcp.com' }
    ]
  }).lean();

  if (!student) {
    console.log('❌ Student BHAVANI D not found in User collection!');
    await mongoose.disconnect();
    return;
  }

  console.log('Student Profile:');
  console.log({
    _id: student._id,
    name: student.name,
    email: student.email,
    slaeId: student.slaeId,
    technicalBatch: student.technicalBatch,
    communicationBatch: student.communicationBatch,
    aptitudeBatch: student.aptitudeBatch,
    batches: student.batches,
    createdAt: student.createdAt
  });

  // 2. Find Enrollments
  const enrollments = await Enrollment.find({ studentId: student._id }).lean();
  console.log('\nEnrollment Documents (', enrollments.length, '):');
  enrollments.forEach(e => {
    console.log({
      _id: e._id,
      batchId: e.batchId,
      department: e.department,
      course: e.course,
      status: e.status,
      startDate: e.startDate,
      createdAt: e.createdAt
    });
  });

  // 3. Find Batch 6
  const batch6 = await Batch.findOne({
    $or: [
      { name: /Batch 6/i },
      { batchId: /BATCH_6/i },
      { batchId: /BATCH-6/i }
    ]
  }).lean();

  console.log('\nBatch 6 Details:');
  if (batch6) {
    console.log({
      _id: batch6._id,
      name: batch6.name,
      batchId: batch6.batchId,
      course: batch6.course,
      studentsCount: batch6.students?.length
    });
  } else {
    console.log('Batch 6 not found directly by name regex!');
  }

  // 4. Find Attendance records for today (2026-08-17)
  const startOfDay = new Date('2026-08-17');
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date('2026-08-17');
  endOfDay.setHours(23,59,59,999);

  const attendanceLogs = await Attendance.find({
    student: student._id,
    date: { $gte: startOfDay, $lte: endOfDay }
  })
  .populate('batch', 'name course')
  .populate('scannedBatch', 'name course')
  .lean();

  console.log('\nAttendance Logs for BHAVANI D on 2026-08-17 (', attendanceLogs.length, '):');
  attendanceLogs.forEach(a => {
    console.log({
      _id: a._id,
      date: a.date,
      status: a.status,
      subject: a.subject,
      batch: a.batch,
      scannedBatch: a.scannedBatch,
      timeIn: a.timeIn,
      remarks: a.remarks,
      markedBy: a.markedBy
    });
  });

  console.log('\n========================================================================');
  await mongoose.disconnect();
}

inspectBhavaniScan().catch(console.error);
