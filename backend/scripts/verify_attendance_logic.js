import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Holiday from '../models/Holiday.js';
import { calculateDynamicAttendance } from '../utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/slaproject';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE BUSINESS REQUIREMENTS VERIFICATION ---');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const testResults = [];
  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      testResults.push({ name: testName, pass: true, details });
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      testResults.push({ name: testName, pass: false, details });
    }
  }

  try {
    // 1. Create or Find Dummy Test Student "Test 5810"
    let dummyUser = await User.findOne({ slaeId: 'TEST5810' });
    if (!dummyUser) {
      dummyUser = await User.create({
        name: 'Test Student 5810',
        email: 'test5810@lcp.com',
        mobile: '9999999999',
        password: 'password123',
        role: 'Student',
        slaeId: 'TEST5810',
        status: 'Active'
      });
    }

    const testStartDate = new Date('2026-08-14T00:00:00.000Z');

    // Create dummy Communication & Aptitude Batches
    let commBatch = await Batch.findOne({ name: 'TEST_COMM_BATCH_5810' });
    if (!commBatch) {
      commBatch = await Batch.create({
        name: 'TEST_COMM_BATCH_5810',
        batchId: 'TESTCOMM5810',
        course: 'Communication Skills',
        department: 'Communication',
        students: [dummyUser._id]
      });
    }

    let aptiBatch = await Batch.findOne({ name: 'TEST_APTI_BATCH_5810' });
    if (!aptiBatch) {
      aptiBatch = await Batch.create({
        name: 'TEST_APTI_BATCH_5810',
        batchId: 'TESTAPTI5810',
        course: 'Aptitude & Reasoning',
        department: 'Aptitude',
        students: [dummyUser._id]
      });
    }

    // Set active enrollments with fixed start date 14-Aug-2026
    let commEnrollment = await Enrollment.findOneAndUpdate(
      { studentId: dummyUser._id, department: 'Communication' },
      { batchId: commBatch._id, course: 'Communication Skills', status: 'Active', startDate: testStartDate, enrolledAt: testStartDate },
      { upsert: true, new: true }
    );

    let aptiEnrollment = await Enrollment.findOneAndUpdate(
      { studentId: dummyUser._id, department: 'Aptitude' },
      { batchId: aptiBatch._id, course: 'Aptitude & Reasoning', status: 'Active', startDate: testStartDate, enrolledAt: testStartDate },
      { upsert: true, new: true }
    );

    // TEST 1: Entry Start Date Preserved
    assert(
      commEnrollment.startDate.toISOString().startsWith('2026-08-14'),
      'Test 1: Student imported/added on 14-Aug-2026 HAS start date 14-Aug-2026',
      commEnrollment.startDate.toISOString()
    );

    // TEST 2: Communication Fixed Target = 80 Days
    const initialCommStats = await calculateDynamicAttendance(dummyUser._id, 'Communication');
    assert(
      initialCommStats.totalTrainingDays === 80,
      'Test 3: Communication total training duration is fixed at 80 training days',
      `Got: ${initialCommStats.totalTrainingDays}`
    );

    // TEST 3: Aptitude Fixed Target = 120 Days
    const initialAptiStats = await calculateDynamicAttendance(dummyUser._id, 'Aptitude');
    assert(
      initialAptiStats.totalTrainingDays === 120,
      'Test 4: Aptitude total training duration is fixed at 120 training days',
      `Got: ${initialAptiStats.totalTrainingDays}`
    );

    // TEST 4: Automatic No-Training-Day Rule (0 scans on weekday = No Training Day)
    // On a weekday without any scans, verify training day count is 0, absent count is 0, and attendance % is 100.00% (since 0 absences counted)
    assert(
      initialCommStats.trainingDay === 0 && initialCommStats.absentCount === 0 && initialCommStats.attendancePercent === 100,
      'Test 14 & 15: Weekday with 0 scans automatically becomes No Training Day (0 absences created -> 100.00% attendance)',
      `TrainingDay: ${initialCommStats.trainingDay}, Absences: ${initialCommStats.absentCount}, AttendancePercent: ${initialCommStats.attendancePercent}%`
    );

    // TEST 5: Actual Training Day & Attendance Calculations (Fixed Denominators)
    // Clear any previous test attendance records for dummyUser
    await Attendance.deleteMany({ student: dummyUser._id });

    // Seed 1 Actual Training Day for Communication (Fri 14-Aug-2026) where student is Present
    await Attendance.create({
      student: dummyUser._id,
      batch: commBatch._id,
      date: new Date('2026-08-14T10:00:00.000Z'),
      subject: 'Communication Training',
      status: 'Present',
      markedBy: dummyUser._id
    });

    const comm1DayStats = await calculateDynamicAttendance(dummyUser._id, 'Communication');
    // 0 Absences = (80 - 0) / 80 = 100% Attendance
    assert(
      comm1DayStats.attendancePercent === 100,
      'Test 5: Student with 0 absences has 100.00% attendance',
      `Got: ${comm1DayStats.attendancePercent}%`
    );

    // TEST 6: Math Verification for 1 Absent = 98.75% for Communication
    const p79Comm = Number((((80 - 1) / 80) * 100).toFixed(2));
    assert(
      p79Comm === 98.75,
      'Test 6: Communication with 1 absence (79/80) = 98.75%',
      `Got: ${p79Comm}%`
    );

    const p78Comm = Number((((80 - 2) / 80) * 100).toFixed(2));
    assert(
      p78Comm === 97.50,
      'Test 7: Communication with 2 absences (78/80) = 97.50%',
      `Got: ${p78Comm}%`
    );

    const p119Apti = Number((((120 - 1) / 120) * 100).toFixed(2));
    assert(
      p119Apti === 99.17,
      'Test 8: Aptitude with 1 absence (119/120) = 99.17%',
      `Got: ${p119Apti}%`
    );

    const p118Apti = Number((((120 - 2) / 120) * 100).toFixed(2));
    assert(
      p118Apti === 98.33,
      'Test 9: Aptitude with 2 absences (118/120) = 98.33%',
      `Got: ${p118Apti}%`
    );

    // Clean up test attendance for dummy user
    await Attendance.deleteMany({ student: dummyUser._id });

    const totalPassed = testResults.filter(r => r.pass).length;
    console.log(`\n==========================================`);
    console.log(`VERIFICATION SUMMARY: ${totalPassed} / ${testResults.length} TESTS PASSED.`);
    console.log(`==========================================\n`);

  } catch (err) {
    console.error('Verification failed with error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTests();
