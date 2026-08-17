import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';
import { bulkSyncStudentBatches } from '../utils/trainerMapper.js';
import { calculateBulkStudentsAttendance, calculateSingleStudentAttendance } from '../services/attendanceService.js';
import { autoCloseAttendanceForToday } from '../services/cronService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runPerformanceAudit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('========================================================================');
  console.log('          LCP APPLICATION PERFORMANCE & ATTENDANCE AUDIT SUITE          ');
  console.log('========================================================================\n');

  // 1. Index Audit
  console.log('--- 1. DATABASE INDEX VERIFICATION ---');
  const userIndexes = await User.collection.indexes();
  const enrollIndexes = await Enrollment.collection.indexes();
  const attIndexes = await Attendance.collection.indexes();
  const scoreIndexes = await Score.collection.indexes();

  console.log(`User collection indexes (${userIndexes.length}):`, userIndexes.map(i => Object.keys(i.key).join('+')));
  console.log(`Enrollment collection indexes (${enrollIndexes.length}):`, enrollIndexes.map(i => Object.keys(i.key).join('+')));
  console.log(`Attendance collection indexes (${attIndexes.length}):`, attIndexes.map(i => Object.keys(i.key).join('+')));
  console.log(`Score collection indexes (${scoreIndexes.length}):`, scoreIndexes.map(i => Object.keys(i.key).join('+')));

  // 2. Excel Bulk Ingestion Performance Benchmark
  console.log('\n--- 2. EXCEL BULK INGESTION PERFORMANCE BENCHMARK ---');
  const mockSizes = [200, 500];

  for (const size of mockSizes) {
    const mockSyncItems = [];
    for (let i = 1; i <= size; i++) {
      const eid = `PERF-TEST-${size}-${i}`;
      const mockId = new mongoose.Types.ObjectId();
      mockSyncItems.push({
        studentId: mockId,
        batches: {
          technicalBatch: `PERF-TECH-BATCH-${size}`,
          communicationBatch: `PERF-COMM-BATCH-${size}`,
          aptitudeBatch: `PERF-APTI-BATCH-${size}`
        }
      });
    }

    const tStart = Date.now();
    await bulkSyncStudentBatches(mockSyncItems);
    const duration = Date.now() - tStart;
    console.log(`✅ Bulk Sync & Ingestion for ${size} synthetic records completed in: ${duration} ms (${(duration/1000).toFixed(2)} seconds)`);

    // Clean up test batches
    await Batch.deleteMany({ name: new RegExp(`PERF-.*-BATCH-${size}`) });
    await Enrollment.deleteMany({ course: new RegExp(`PERF-.*-BATCH-${size}`) });
  }

  // 3. Attendance Calculation Performance Benchmark
  console.log('\n--- 3. ATTENDANCE CALCULATION PERFORMANCE BENCHMARK ---');
  const sampleStudents = await User.find({ role: 'Student' }).limit(50).select('_id').lean();
  const sampleIds = sampleStudents.map(s => s._id);

  if (sampleIds.length > 0) {
    const tCalcStart = Date.now();
    const bulkCommStats = await calculateBulkStudentsAttendance(sampleIds, 'Communication');
    const calcDuration = Date.now() - tCalcStart;
    console.log(`✅ Bulk Attendance calculation for ${sampleIds.length} students completed in: ${calcDuration} ms (Avg: ${(calcDuration/sampleIds.length).toFixed(2)} ms/student)`);
  }

  // 4. Exact Mathematical Scenario Verification
  console.log('\n--- 4. EXACT MATHEMATICAL SCENARIO VERIFICATION ---');
  
  // Test Comm 80 days - 1 absence
  const dummyCommId = new mongoose.Types.ObjectId();
  const dummyBatch = await Batch.create({
    name: 'TEST-AUDIT-COMM-BATCH',
    batchId: 'TESTAUDITCOMM',
    course: 'Communication Skills',
    students: [dummyCommId]
  });

  const dummyUser = await User.create({
    _id: dummyCommId,
    name: 'Audit Comm Student',
    email: 'auditcomm@lcp.com',
    mobile: '9876543210',
    password: 'password123',
    role: 'Student',
    slaeId: 'AUDITCOMM1'
  });

  const dummyEnroll = await Enrollment.create({
    studentId: dummyCommId,
    batchId: dummyBatch._id,
    department: 'Communication',
    course: 'Communication Skills',
    status: 'Active',
    startDate: new Date('2026-08-01')
  });

  // Log 1 absence
  await Attendance.create({
    student: dummyCommId,
    batch: dummyBatch._id,
    date: new Date('2026-08-03'), // Monday
    status: 'Absent',
    subject: 'Communication',
    markedBy: dummyCommId
  });

  const commStats = await calculateSingleStudentAttendance(dummyCommId, 'Communication');
  console.log(`Communication (80d, 1 absence): Expected 98.75% -> Calculated: ${commStats.attendancePercent}%`);
  const commPass = commStats.attendancePercent === 98.75;
  console.log(`  Result: ${commPass ? 'PASS 🎉' : 'FAIL ❌'}`);

  // Test Aptitude 120 days - 1 absence
  await Enrollment.updateOne({ _id: dummyEnroll._id }, { department: 'Aptitude', course: 'Aptitude & Reasoning' });
  await Attendance.updateOne({ student: dummyCommId }, { subject: 'Aptitude' });

  const aptiStats = await calculateSingleStudentAttendance(dummyCommId, 'Aptitude');
  console.log(`Aptitude (120d, 1 absence): Expected 99.17% -> Calculated: ${aptiStats.attendancePercent}%`);
  const aptiPass = aptiStats.attendancePercent === 99.17;
  console.log(`  Result: ${aptiPass ? 'PASS 🎉' : 'FAIL ❌'}`);

  // Clean up audit test records
  await User.deleteOne({ _id: dummyCommId });
  await Batch.deleteOne({ _id: dummyBatch._id });
  await Enrollment.deleteOne({ _id: dummyEnroll._id });
  await Attendance.deleteMany({ student: dummyCommId });

  // 5. 6 PM Auto-Close Execution Test
  console.log('\n--- 5. 6:00 PM IST AUTOMATIC ATTENDANCE CLOSE TEST ---');
  const cronRes = await autoCloseAttendanceForToday();
  console.log('Auto-close execution result:', cronRes);

  console.log('\n========================================================================');
  console.log('             AUDIT & VERIFICATION SUITE COMPLETE 🎉                     ');
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

runPerformanceAudit().catch(console.error);
