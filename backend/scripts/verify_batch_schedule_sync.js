import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import { calculateBulkStudentsAttendance } from '../services/attendanceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyBatchScheduleSync() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('========================================================================');
  console.log('         VERIFYING BATCH SCHEDULE SINGLE SOURCE OF TRUTH                ');
  console.log('========================================================================\n');

  const dummyStudentId = new mongoose.Types.ObjectId();
  
  // 1. Create APTI_BATCH_6 with 04:00 PM - 05:00 PM schedule
  const aptiBatch = await Batch.create({
    name: 'Batch 6',
    batchId: 'APTI_BATCH_6',
    course: 'Aptitude & Reasoning',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    days: 'Monday – Friday',
    status: 'Active',
    students: [dummyStudentId]
  });

  const dummyUser = await User.create({
    _id: dummyStudentId,
    name: 'Schedule Test Student',
    email: 'scheduletest@lcp.com',
    mobile: '9998887771',
    password: 'password123',
    role: 'Student',
    slaeId: 'SCHEDSTUDENT1'
  });

  const dummyEnrollment = await Enrollment.create({
    studentId: dummyStudentId,
    batchId: aptiBatch._id,
    department: 'Aptitude',
    course: 'Aptitude & Reasoning',
    status: 'Active',
    startDate: new Date('2026-08-14')
  });

  console.log('Step 1: Created Batch APTI_BATCH_6 with schedule: 04:00 PM – 05:00 PM');

  // 2. Simulate Student Dashboard API resolution
  const enrollments = await Enrollment.find({ studentId: dummyStudentId, status: 'Active' })
    .populate('batchId')
    .lean();

  let resolvedBatch = enrollments[0].batchId;
  let scheduleStr = resolvedBatch.schedule || '';
  if (resolvedBatch.startTime && resolvedBatch.endTime) {
    scheduleStr = `${resolvedBatch.startTime} – ${resolvedBatch.endTime}`;
  }

  console.log(`Resolved API Schedule output: "${scheduleStr}"`);

  const test1Pass = scheduleStr === '04:00 PM – 05:00 PM';
  console.log(`Test 1 (Initial Schedule Match): ${test1Pass ? 'PASS 🎉' : 'FAIL ❌'}`);

  // 3. Admin updates batch schedule to 05:00 PM – 06:00 PM
  await Batch.updateOne(
    { _id: aptiBatch._id },
    { startTime: '05:00 PM', endTime: '06:00 PM' }
  );

  console.log('\nStep 2: Admin updated APTI_BATCH_6 schedule to: 05:00 PM – 06:00 PM');

  // 4. Re-fetch Student Dashboard API resolution
  const updatedEnrollments = await Enrollment.find({ studentId: dummyStudentId, status: 'Active' })
    .populate('batchId')
    .lean();

  let updatedResolvedBatch = updatedEnrollments[0].batchId;
  let updatedScheduleStr = updatedResolvedBatch.schedule || '';
  if (updatedResolvedBatch.startTime && updatedResolvedBatch.endTime) {
    updatedScheduleStr = `${updatedResolvedBatch.startTime} – ${updatedResolvedBatch.endTime}`;
  }

  console.log(`Updated Resolved API Schedule output: "${updatedScheduleStr}"`);

  const test2Pass = updatedScheduleStr === '05:00 PM – 06:00 PM';
  console.log(`Test 2 (Dynamic Update Match): ${test2Pass ? 'PASS 🎉' : 'FAIL ❌'}`);

  // Clean up test data
  await Batch.deleteOne({ _id: aptiBatch._id });
  await User.deleteOne({ _id: dummyStudentId });
  await Enrollment.deleteOne({ _id: dummyEnrollment._id });

  console.log('\n========================================================================');
  console.log(`FINAL RESULT: ${test1Pass && test2Pass ? 'ALL BATCH SCHEDULE SYNC TESTS PASSED 🎉' : 'TESTS FAILED ❌'}`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

verifyBatchScheduleSync().catch(console.error);
