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

async function inspectArunC() {
  console.log('========================================================================');
  console.log('         ARUN C (5798) DATABASE RECORD & SCAN TRACE                    ');
  console.log('========================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const student = await User.findOne({ 
    $or: [
      { slaeId: '5798' },
      { email: '5798@lcp.com' },
      { name: /ARUN C/i }
    ]
  }).lean();

  if (!student) {
    console.log('❌ Student ARUN C not found in User collection!');
    await mongoose.disconnect();
    return;
  }

  console.log('User Document:');
  console.log({
    _id: student._id,
    name: student.name,
    email: student.email,
    slaeId: student.slaeId,
    technicalBatch: student.technicalBatch,
    communicationBatch: student.communicationBatch,
    aptitudeBatch: student.aptitudeBatch,
    createdAt: student.createdAt
  });

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

  console.log('\nAttendance Logs for ARUN C on 2026-08-17 (', attendanceLogs.length, '):');
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
      markedBy: a.markedBy,
      createdAt: a.createdAt
    });
  });

  console.log('\n========================================================================');
  await mongoose.disconnect();
}

inspectArunC().catch(console.error);
