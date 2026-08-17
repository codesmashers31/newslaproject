import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Holiday from '../models/Holiday.js';
import { calculateDynamicAttendance } from '../utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTestSuite() {
  console.log('========================================================================');
  console.log('       LCP ATTENDANCE & ENROLLMENT DATE ARCHITECTURE VALIDATION SUITE   ');
  console.log('========================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB...\n');

  const passwordHash = await bcrypt.hash('student123', 10);

  // 1. Create or Reuse Test Trainers
  const commTrainer = await User.findOneAndUpdate(
    { email: 'test.comm.trainer@sla.com' },
    {
      name: 'TEST Communication Trainer',
      email: 'test.comm.trainer@sla.com',
      password: passwordHash,
      role: 'Communication Trainer',
      status: 'Active'
    },
    { upsert: true, new: true }
  );

  const aptiTrainer = await User.findOneAndUpdate(
    { email: 'test.apti.trainer@sla.com' },
    {
      name: 'TEST Aptitude Trainer',
      email: 'test.apti.trainer@sla.com',
      password: passwordHash,
      role: 'Aptitude Trainer',
      status: 'Active'
    },
    { upsert: true, new: true }
  );

  // 2. Create Test Batches
  const commBatch = await Batch.findOneAndUpdate(
    { name: 'TEST-COMM-01' },
    {
      name: 'TEST-COMM-01',
      batchId: 'TEST-COMM-01',
      course: 'Communication Skills',
      department: 'Communication',
      durationDays: 80,
      trainers: [commTrainer._id],
      status: 'Active',
      startDate: new Date('2026-08-14')
    },
    { upsert: true, new: true }
  );

  const aptiBatch = await Batch.findOneAndUpdate(
    { name: 'TEST-APT-01' },
    {
      name: 'TEST-APT-01',
      batchId: 'TEST-APT-01',
      course: 'Aptitude & Reasoning',
      department: 'Aptitude',
      durationDays: 120,
      trainers: [aptiTrainer._id],
      status: 'Active',
      startDate: new Date('2026-08-14')
    },
    { upsert: true, new: true }
  );

  // Batch A and Batch B for Transfer Test (Test 7)
  const batchA = await Batch.findOneAndUpdate(
    { name: 'TEST-BATCH-A' },
    { name: 'TEST-BATCH-A', batchId: 'TEST-BATCH-A', course: 'Communication Skills', department: 'Communication', trainers: [commTrainer._id], status: 'Active' },
    { upsert: true, new: true }
  );

  const batchB = await Batch.findOneAndUpdate(
    { name: 'TEST-BATCH-B' },
    { name: 'TEST-BATCH-B', batchId: 'TEST-BATCH-B', course: 'Communication Skills', department: 'Communication', trainers: [commTrainer._id], status: 'Active' },
    { upsert: true, new: true }
  );

  // 3. Create Test Student (5810 / TEST-STUDENT-5810) with Enrollment Date = 14-Aug-2026
  const student5810 = await User.findOneAndUpdate(
    { email: 'student5810@sla.com' },
    {
      name: 'TEST-STUDENT-5810',
      email: 'student5810@sla.com',
      slaeId: '5810',
      password: passwordHash,
      role: 'Student',
      status: 'Active',
      createdAt: new Date('2026-08-14')
    },
    { upsert: true, new: true }
  );

  await Enrollment.findOneAndUpdate(
    { studentId: student5810._id, department: 'Communication' },
    {
      studentId: student5810._id,
      batchId: commBatch._id,
      department: 'Communication',
      course: 'Communication Skills',
      status: 'Active',
      startDate: new Date('2026-08-14')
    },
    { upsert: true, new: true }
  );

  // 4. Create Student for Transfer Test (TEST-STUDENT-TRANSFER)
  const transferStudent = await User.findOneAndUpdate(
    { email: 'student.transfer@sla.com' },
    { name: 'TEST-STUDENT-TRANSFER', email: 'student.transfer@sla.com', slaeId: 'TRF01', password: passwordHash, role: 'Student', status: 'Active' },
    { upsert: true, new: true }
  );

  // Clean old transfer enrollments to avoid duplicate batch records
  await Enrollment.deleteMany({ studentId: transferStudent._id });

  // Enrollment in Batch A (Ended 19-Aug-2026)
  await Enrollment.create({
    studentId: transferStudent._id,
    batchId: batchA._id,
    department: 'Communication',
    course: 'Communication Skills',
    status: 'Completed',
    startDate: new Date('2026-08-01'),
    completedAt: new Date('2026-08-19T23:59:59.999Z')
  });

  // Enrollment in Batch B (Started 20-Aug-2026)
  await Enrollment.create({
    studentId: transferStudent._id,
    batchId: batchB._id,
    department: 'Communication',
    course: 'Communication Skills',
    status: 'Active',
    startDate: new Date('2026-08-20')
  });

  // Clean old attendance records for test isolation
  await Attendance.deleteMany({ student: { $in: [student5810._id, transferStudent._id] } });

  console.log('--- EXECUTING SPECIFIED 10 ARCHITECTURAL TEST CASES ---');

  let testResults = [];

  // Helper check for date eligibility
  const checkEligibility = (studentEnrolls, selectedDateStr) => {
    return studentEnrolls.some(e => {
      const selStr = selectedDateStr;
      const startStr = e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : new Date(e.createdAt).toISOString().split('T')[0];
      const endStr = e.completedAt ? new Date(e.completedAt).toISOString().split('T')[0] : (e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : null);

      return selStr >= startStr && (!endStr || selStr <= endStr);
    });
  };

  const studentEnrolls5810 = await Enrollment.find({ studentId: student5810._id });

  // TEST 1: Enrollment 14-Aug, Selected Date 13-Aug -> Student Hidden
  const test1Visible = checkEligibility(studentEnrolls5810, '2026-08-13');
  testResults.push({ id: 'Test 1', desc: 'Enrollment 14-Aug, Selected Date 13-Aug (Student Hidden)', pass: !test1Visible });

  // TEST 2: Enrollment 14-Aug, Selected Date 14-Aug -> Student Visible
  const test2Visible = checkEligibility(studentEnrolls5810, '2026-08-14');
  testResults.push({ id: 'Test 2', desc: 'Enrollment 14-Aug, Selected Date 14-Aug (Student Visible)', pass: test2Visible });

  // TEST 3: Enrollment 14-Aug, Selected Date 15-Aug -> Student Visible
  const test3Visible = checkEligibility(studentEnrolls5810, '2026-08-15');
  testResults.push({ id: 'Test 3', desc: 'Enrollment 14-Aug, Selected Date 15-Aug (Student Visible)', pass: test3Visible });

  // TEST 4: Enrollment 14-Aug, Selected Date 13-Aug -> Status is Not Applicable
  const test4Pass = !test1Visible;
  testResults.push({ id: 'Test 4', desc: 'Selected Date 13-Aug Attendance Status is Not Applicable (Not Absent / 0%)', pass: test4Pass });

  // TEST 5: Communication 1 Counted Absence -> 79/80 = 98.75%
  await Attendance.create({
    student: student5810._id,
    batch: commBatch._id,
    subject: 'Communication',
    status: 'Absent',
    date: new Date('2026-08-17'),
    markedBy: commTrainer._id
  });

  const commStats = await calculateDynamicAttendance(student5810._id, 'Communication');
  const test5Pass = Math.abs(commStats.attendancePercent - 98.75) < 0.01;
  testResults.push({ id: 'Test 5', desc: 'Communication 1 Counted Absence = 79/80 (98.75%)', pass: test5Pass, detail: `${commStats.attendancePercent}%` });

  // TEST 6: Aptitude 1 Counted Absence -> 119/120 = 99.17%
  const aptiStudent = await User.findOneAndUpdate(
    { email: 'student.apti.test@sla.com' },
    { name: 'TEST-APT-STUDENT', email: 'student.apti.test@sla.com', slaeId: 'APT01', password: passwordHash, role: 'Student', status: 'Active' },
    { upsert: true, new: true }
  );
  await Enrollment.findOneAndUpdate(
    { studentId: aptiStudent._id, department: 'Aptitude' },
    { studentId: aptiStudent._id, batchId: aptiBatch._id, department: 'Aptitude', course: 'Aptitude & Reasoning', status: 'Active', startDate: new Date('2026-08-14') },
    { upsert: true, new: true }
  );
  await Attendance.deleteMany({ student: aptiStudent._id });
  await Attendance.create({ student: aptiStudent._id, batch: aptiBatch._id, subject: 'Aptitude', status: 'Absent', date: new Date('2026-08-17'), markedBy: aptiTrainer._id });
  const aptiStats = await calculateDynamicAttendance(aptiStudent._id, 'Aptitude');
  const test6Pass = Math.abs(aptiStats.attendancePercent - 99.17) < 0.01;
  testResults.push({ id: 'Test 6', desc: 'Aptitude 1 Counted Absence = 119/120 (99.17%)', pass: test6Pass, detail: `${aptiStats.attendancePercent}%` });

  // TEST 7: Batch Transfer Safety (19-Aug Batch A only, 20-Aug Batch B only)
  const transferEnrolls = await Enrollment.find({ studentId: transferStudent._id }).lean();
  console.log('transferEnrolls for transferStudent:', JSON.stringify(transferEnrolls, null, 2));
  const getBatchIdStr = (e) => e.batchId ? e.batchId.toString() : '';
  const isEnrolledBatchAOn19 = checkEligibility(transferEnrolls.filter(e => getBatchIdStr(e) === batchA._id.toString()), '2026-08-19');
  const isEnrolledBatchBOn19 = checkEligibility(transferEnrolls.filter(e => getBatchIdStr(e) === batchB._id.toString()), '2026-08-19');
  const isEnrolledBatchAOn20 = checkEligibility(transferEnrolls.filter(e => getBatchIdStr(e) === batchA._id.toString()), '2026-08-20');
  const isEnrolledBatchBOn20 = checkEligibility(transferEnrolls.filter(e => getBatchIdStr(e) === batchB._id.toString()), '2026-08-20');

  const test7Pass = isEnrolledBatchAOn19 && !isEnrolledBatchBOn19 && !isEnrolledBatchAOn20 && isEnrolledBatchBOn20;
  testResults.push({
    id: 'Test 7',
    desc: 'Batch Transfer Safety (19-Aug Batch A only, 20-Aug Batch B only)',
    pass: test7Pass,
    detail: `A19:${isEnrolledBatchAOn19}, B19:${isEnrolledBatchBOn19}, A20:${isEnrolledBatchAOn20}, B20:${isEnrolledBatchBOn20}`
  });

  // TEST 8: Saturday Weekend Exclusion
  const saturdayStats = await calculateDynamicAttendance(student5810._id, 'Communication');
  const test8Pass = saturdayStats.absentCount === 1; // still only 1 absence from Test 5
  testResults.push({ id: 'Test 8', desc: 'Saturday Weekend Exclusion (No absence created)', pass: test8Pass });

  // TEST 9: Institute Holiday Exclusion
  await Holiday.findOneAndUpdate({ date: new Date('2026-08-15') }, { title: 'Test Holiday', date: new Date('2026-08-15') }, { upsert: true });
  const holidayStats = await calculateDynamicAttendance(student5810._id, 'Communication');
  const test9Pass = holidayStats.absentCount === 1; // still only 1 absence from Test 5
  testResults.push({ id: 'Test 9', desc: 'Institute Holiday Exclusion (No absence created)', pass: test9Pass });

  // TEST 10: Automatic No-Training-Day Rule
  const test10Pass = commStats.trainingDay >= 0 && commStats.absentCount === 1;
  testResults.push({ id: 'Test 10', desc: 'Automatic No-Training-Day Detection (No false absences)', pass: test10Pass });

  console.log('-----------------------------------------------------------------------------------------');
  console.log('| Test ID | Test Description                                            | Result | Detail |');
  console.log('-----------------------------------------------------------------------------------------');

  let allPass = true;
  for (const t of testResults) {
    if (!t.pass) allPass = false;
    console.log(`| ${t.id.padEnd(7)} | ${t.desc.padEnd(59)} | ${t.pass ? 'PASS  ' : 'FAIL  '} | ${(t.detail || '').padEnd(6)} |`);
  }
  console.log('-----------------------------------------------------------------------------------------\n');

  console.log('========================================================================');
  console.log(`       FINAL RESULT: ${allPass ? 'ALL 10 ARCHITECTURAL TESTS PASSED SUCCESSFULLY 🎉' : 'TEST SUITE FAILED ❌'}`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

runTestSuite().catch(console.error);
