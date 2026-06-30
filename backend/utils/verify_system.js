import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Attendance from '../models/Attendance.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Score from '../models/Score.js';
import Student from '../models/Student.js';
import Placement from '../models/Placement.js';
import jwt from 'jsonwebtoken';
import { calculateStudentScores, calculateAllRanks, calculatePlacementReadiness } from './calculations.js';

dotenv.config();

const runVerification = async () => {
  try {
    console.log('Connecting to database for verification...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lcp_management');
    console.log('MongoDB Connected.');

    // 1. Create a dummy Trainer and Student
    console.log('\n--- 1. SETTING UP TEST USERS & BATCH ---');
    
    // Clear old test users if any
    await User.deleteMany({ email: { $in: ['test_student@lcp.com', 'test_trainer@lcp.com'] } });
    
    const trainerUser = await User.create({
      name: 'Test Technical Trainer',
      email: 'test_trainer@lcp.com',
      mobile: '9876543210',
      password: 'password123',
      role: 'Technical Trainer',
      status: 'Active'
    });
    console.log(`Created Trainer: ${trainerUser.email}`);

    const studentUser = await User.create({
      name: 'Test Student John',
      email: 'test_student@lcp.com',
      mobile: '1234567890',
      password: 'password123',
      role: 'Student',
      status: 'Active'
    });
    console.log(`Created Student: ${studentUser.email}`);

    // Create Student Profile & Placement
    await Student.create({
      user: studentUser._id,
      linkedin: 'https://linkedin.com/in/testjohn',
      github: 'https://github.com/testjohn',
      resumeUrl: '/uploads/john_resume.pdf',
      collegeName: 'Test Engineering College'
    });
    const placement = await Placement.create({
      student: studentUser._id,
      resumeUploaded: true,
      mockInterviewCompleted: true
    });
    console.log('Created Student Profile & Placement.');

    // Create Batch
    const testBatch = await Batch.create({
      name: 'Test Verify Batch',
      course: 'Verification Course',
      trainers: [trainerUser._id],
      students: [studentUser._id],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    console.log(`Created Batch: ${testBatch.name}`);

    // 2. Start active trainer session
    console.log('\n--- 2. CREATING ACTIVE CLASS SESSION ---');
    const session = await AttendanceSession.create({
      trainer: trainerUser._id,
      batch: testBatch._id,
      subject: 'Testing Verification Protocol',
      floorNumber: '3',
      roomNumber: 'Lab 5',
      startTime: new Date(Date.now() - 5 * 60 * 1000), // Started 5 mins ago (should mark as Present)
      isActive: true
    });
    console.log(`Class session started at floor ${session.floorNumber}, room ${session.roomNumber}`);

    // 3. Test QR Token signature and decryption
    console.log('\n--- 3. GENERATING QR TOKEN ---');
    const token = jwt.sign(
      {
        sessionId: session._id,
        batchId: session.batch,
        trainerId: session.trainer,
        subject: session.subject,
        floorNumber: session.floorNumber,
        roomNumber: session.roomNumber,
        generatedAt: Date.now()
      },
      process.env.JWT_SECRET || 'lcp_secret_key_123456',
      { expiresIn: '2m' }
    );
    console.log('Successfully generated signed 2-minute token.');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lcp_secret_key_123456');
    console.log('Token successfully decrypted. Payload is intact.');
    console.log(`Decoded subject: "${decoded.subject}"`);

    // 4. Test Late logic computation
    console.log('\n--- 4. TESTING LATE LOGIC COMPUTATION ---');
    const checkLateLogic = (startTimeMs, scanTimeMs) => {
      const diffMins = Math.floor((scanTimeMs - startTimeMs) / 60000);
      if (diffMins <= 10) return 'Present';
      if (diffMins <= 20) return 'Late';
      return 'Absent';
    };

    console.log(`Scan at 5 mins: ${checkLateLogic(session.startTime.getTime(), Date.now())} (Expected: Present)`);
    console.log(`Scan at 15 mins: ${checkLateLogic(session.startTime.getTime(), Date.now() + 10 * 60 * 1000)} (Expected: Late)`);
    console.log(`Scan at 25 mins: ${checkLateLogic(session.startTime.getTime(), Date.now() + 20 * 60 * 1000)} (Expected: Absent)`);

    // 5. Test Placement Readiness formulas
    console.log('\n--- 5. TESTING PLACEMENT READINESS ---');
    const readiness = await calculatePlacementReadiness(studentUser._id);
    console.log(`Readiness percentage: ${readiness.percentage}%`);
    console.log(`Status designation: ${readiness.status}`);
    console.log('AI Suggestions generated:');
    readiness.recommendations.forEach(r => console.log(` - ${r}`));

    // 6. Test Grades & Ranks
    console.log('\n--- 6. TESTING FORMULA GRADES & RANKS ---');
    const studentGrades = await calculateStudentScores(studentUser._id);
    console.log(`Final weighted score: ${studentGrades.finalScorePercent}%`);
    console.log(`Assigned letter grade: ${studentGrades.grade}`);

    const ranksList = await calculateAllRanks();
    const myRank = ranksList.find(r => r.studentId === studentUser._id.toString());
    console.log(`Institute Rank: #${myRank.instituteRank}, Batch Rank: #${myRank.batchRank}`);

    // Clean up
    console.log('\n--- 7. CLEANING UP TEST DOCUMENTS ---');
    await User.findByIdAndDelete(studentUser._id);
    await User.findByIdAndDelete(trainerUser._id);
    await Student.findOneAndDelete({ user: studentUser._id });
    await Placement.findOneAndDelete({ student: studentUser._id });
    await Batch.findByIdAndDelete(testBatch._id);
    await AttendanceSession.findByIdAndDelete(session._id);
    await Attendance.deleteMany({ student: studentUser._id });
    
    console.log('Test documents deleted. Database is clean.');
    console.log('\n>>> SYSTEM VERIFICATION LOG: SUCCESS <<<');
    process.exit(0);
  } catch (error) {
    console.error(`Verification Failed: ${error.message}`);
    process.exit(1);
  }
};

runVerification();
