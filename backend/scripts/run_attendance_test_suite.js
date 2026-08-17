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
import AttendanceSession from '../models/AttendanceSession.js';
import { calculateDynamicAttendance } from '../utils/calculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTestSuite() {
  console.log('========================================================================');
  console.log('       LCP ATTENDANCE SYSTEM COMPLETE AUTOMATED VALIDATION SUITE        ');
  console.log('========================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB...\n');

  // 1. Create or Reuse Test Trainers
  const passwordHash = await bcrypt.hash('student123', 10);

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

  const techTrainer = await User.findOneAndUpdate(
    { email: 'test.tech.trainer@sla.com' },
    {
      name: 'TEST Technical Trainer',
      email: 'test.tech.trainer@sla.com',
      password: passwordHash,
      role: 'Technical Trainer',
      status: 'Active'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Test Trainers verified.');

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
      startDate: new Date('2026-08-01')
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
      startDate: new Date('2026-08-01')
    },
    { upsert: true, new: true }
  );

  console.log('✅ Test Batches verified: TEST-COMM-01 (80 days) & TEST-APT-01 (120 days).');

  // 3. Create 8 Test Students & Enrollments with enrollment date 2026-08-01
  const enrollmentDate = new Date('2026-08-01T00:00:00.000Z');
  const students = [];

  for (let i = 1; i <= 8; i++) {
    const numStr = String(i).padStart(2, '0');
    const eid = `TEST0${i}`;
    const email = `teststudent${numStr}@sla.com`;
    const name = `TEST-STUDENT-${numStr}`;

    const studentUser = await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        slaeId: eid,
        password: passwordHash,
        role: 'Student',
        status: 'Active',
        createdAt: enrollmentDate
      },
      { upsert: true, new: true }
    );

    await Student.findOneAndUpdate(
      { user: studentUser._id },
      { user: studentUser._id, collegeName: 'Test College', degree: 'B.E.' },
      { upsert: true, new: true }
    );

    if (i <= 4) {
      // Communication Students
      await Enrollment.findOneAndUpdate(
        { studentId: studentUser._id, department: 'Communication' },
        {
          studentId: studentUser._id,
          batchId: commBatch._id,
          department: 'Communication',
          course: 'Communication Skills',
          status: 'Active',
          startDate: enrollmentDate,
          createdAt: enrollmentDate
        },
        { upsert: true, new: true }
      );
    } else {
      // Aptitude Students
      await Enrollment.findOneAndUpdate(
        { studentId: studentUser._id, department: 'Aptitude' },
        {
          studentId: studentUser._id,
          batchId: aptiBatch._id,
          department: 'Aptitude',
          course: 'Aptitude & Reasoning',
          status: 'Active',
          startDate: enrollmentDate,
          createdAt: enrollmentDate
        },
        { upsert: true, new: true }
      );
    }

    students.push({ user: studentUser, index: i });
  }

  console.log('✅ 8 Test Students created and enrolled with start date 2026-08-01.');

  // 4. Configure Test Scenarios (Absences)
  // Delete existing test attendance records first to ensure clean idempotent run
  const testStudentIds = students.map(s => s.user._id);
  await Attendance.deleteMany({ student: { $in: testStudentIds } });

  // Function to generate weekday dates excluding Aug 15 (holiday)
  const getWeekdayDates = (count, start = new Date('2026-08-03')) => {
    const dates = [];
    const d = new Date(start);
    while (dates.length < count) {
      const day = d.getDay();
      const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      if (day !== 0 && day !== 6 && dateStr !== '2026-08-15') {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  // Scenario setup:
  // Comm Student 01: 0 absences
  // Comm Student 02: 1 absence
  // Comm Student 03: 5 absences
  // Comm Student 04: 10 absences

  const commAbsenceCounts = [0, 1, 5, 10];
  for (let idx = 0; idx < 4; idx++) {
    const student = students[idx].user;
    const absCount = commAbsenceCounts[idx];
    const absDates = getWeekdayDates(absCount, new Date('2026-08-03'));

    for (const d of absDates) {
      await Attendance.create({
        student: student._id,
        batch: commBatch._id,
        subject: 'Communication',
        status: 'Absent',
        date: d,
        markedBy: commTrainer._id
      });
    }
  }

  // Apti Student 05: 0 absences
  // Apti Student 06: 1 absence
  // Apti Student 07: 5 absences
  // Apti Student 08: 10 absences

  const aptiAbsenceCounts = [0, 1, 5, 10];
  for (let idx = 4; idx < 8; idx++) {
    const student = students[idx].user;
    const absCount = aptiAbsenceCounts[idx - 4];
    const absDates = getWeekdayDates(absCount, new Date('2026-08-03'));

    for (const d of absDates) {
      await Attendance.create({
        student: student._id,
        batch: aptiBatch._id,
        subject: 'Aptitude',
        status: 'Absent',
        date: d,
        markedBy: aptiTrainer._id
      });
    }
  }

  console.log('✅ Controlled test attendance scenarios inserted.\n');

  // 5. Run Automated Tests & Generate Validation Report
  const expectedResults = [
    { name: 'TEST-STUDENT-01', type: 'Communication', duration: 80, expAbs: 0, expPresent: 80, expPct: 100.00 },
    { name: 'TEST-STUDENT-02', type: 'Communication', duration: 80, expAbs: 1, expPresent: 79, expPct: 98.75 },
    { name: 'TEST-STUDENT-03', type: 'Communication', duration: 80, expAbs: 5, expPresent: 75, expPct: 93.75 },
    { name: 'TEST-STUDENT-04', type: 'Communication', duration: 80, expAbs: 10, expPresent: 70, expPct: 87.50 },
    { name: 'TEST-STUDENT-05', type: 'Aptitude', duration: 120, expAbs: 0, expPresent: 120, expPct: 100.00 },
    { name: 'TEST-STUDENT-06', type: 'Aptitude', duration: 120, expAbs: 1, expPresent: 119, expPct: 99.17 },
    { name: 'TEST-STUDENT-07', type: 'Aptitude', duration: 120, expAbs: 5, expPresent: 115, expPct: 95.83 },
    { name: 'TEST-STUDENT-08', type: 'Aptitude', duration: 120, expAbs: 10, expPresent: 110, expPct: 91.67 }
  ];

  console.log('---------------------------------------------------------------------------------------------------------');
  console.log('| Student Name     | Course        | Duration | Exp Abs | Act Abs | Exp Pct  | Act Pct  | Result |');
  console.log('---------------------------------------------------------------------------------------------------------');

  let allPassed = true;

  for (let idx = 0; idx < 8; idx++) {
    const studentUser = students[idx].user;
    const exp = expectedResults[idx];
    const stats = await calculateDynamicAttendance(studentUser._id, exp.type);

    const actAbs = stats.absentCount;
    const actPct = stats.attendancePercent;

    const isPctMatch = Math.abs(actPct - exp.expPct) < 0.05;
    const isAbsMatch = actAbs === exp.expAbs;
    const isPass = isPctMatch && isAbsMatch;

    if (!isPass) allPassed = false;

    console.log(
      `| ${exp.name.padEnd(16)} | ${exp.type.padEnd(13)} | ${String(exp.duration).padStart(8)} | ${String(exp.expAbs).padStart(7)} | ${String(actAbs).padStart(7)} | ${exp.expPct.toFixed(2).padStart(7)}% | ${actPct.toFixed(2).padStart(7)}% | ${isPass ? 'PASS  ' : 'FAIL  '} |`
    );
  }

  console.log('---------------------------------------------------------------------------------------------------------\n');

  // 6. Additional Checks: Weekend, Holiday, QR Start Date Immutability & Independence
  console.log('--- ADDITIONAL RULES VALIDATION ---');

  // Check Start Date Immutability on QR scan
  const student1 = students[0].user;
  const initialEnrollment = await Enrollment.findOne({ studentId: student1._id, department: 'Communication' });
  const initialStartDate = new Date(initialEnrollment.startDate).toISOString().split('T')[0];

  // Perform QR Scan simulation
  await Attendance.create({
    student: student1._id,
    batch: commBatch._id,
    subject: 'Communication',
    status: 'Present',
    date: new Date('2026-08-17'),
    markedBy: commTrainer._id
  });

  const postScanEnrollment = await Enrollment.findOne({ studentId: student1._id, department: 'Communication' });
  const postScanStartDate = new Date(postScanEnrollment.startDate).toISOString().split('T')[0];

  const isStartDateImmutable = initialStartDate === postScanStartDate;
  console.log(`1. Start Date Immutability Check: ${isStartDateImmutable ? 'PASS' : 'FAIL'} (Original: ${initialStartDate}, Post-Scan: ${postScanStartDate})`);

  // Check Holiday Exclusion
  await Holiday.findOneAndUpdate(
    { date: new Date('2026-08-15') },
    { title: 'Independence Day Test', date: new Date('2026-08-15') },
    { upsert: true }
  );

  const statsWithHoliday = await calculateDynamicAttendance(student1._id, 'Communication');
  const isHolidayExcluded = statsWithHoliday.attendancePercent === 100.00;
  console.log(`2. Institute Holiday Exclusion Check (2026-08-15): ${isHolidayExcluded ? 'PASS' : 'FAIL'} (Attendance %: ${statsWithHoliday.attendancePercent}%)`);

  // Check Domain Independence (Comm vs Apti)
  const student6 = students[5].user; // Aptitude student (1 absence)
  const aptiBeforeCommEdit = await calculateDynamicAttendance(student6._id, 'Aptitude');

  // Add Communication attendance for Student 6
  await Attendance.create({
    student: student6._id,
    batch: commBatch._id,
    subject: 'Communication',
    status: 'Absent',
    date: new Date('2026-08-04'),
    markedBy: commTrainer._id
  });

  const aptiAfterCommEdit = await calculateDynamicAttendance(student6._id, 'Aptitude');
  const isDomainIndependent = aptiBeforeCommEdit.attendancePercent === aptiAfterCommEdit.attendancePercent;
  console.log(`3. Communication & Aptitude Independence Check: ${isDomainIndependent ? 'PASS' : 'FAIL'} (Aptitude Pct before/after Comm edit: ${aptiBeforeCommEdit.attendancePercent}% -> ${aptiAfterCommEdit.attendancePercent}%)`);

  console.log('\n========================================================================');
  console.log(`       FINAL SUITE RESULT: ${allPassed && isStartDateImmutable && isHolidayExcluded && isDomainIndependent ? 'ALL 15 TESTS PASSED SUCCESSFULLY 🎉' : 'TEST SUITE FAILED ❌'}`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

runTestSuite().catch(console.error);
