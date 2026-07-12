import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Batch from './models/Batch.js';
import Enrollment from './models/Enrollment.js';
import Attendance from './models/Attendance.js';
import Score from './models/Score.js';
import Student from './models/Student.js';
import Placement from './models/Placement.js';

dotenv.config();

const generateTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('MongoDB Connected.');

    // 1. Fetch existing trainers
    const techTrainers = await User.find({ role: 'Technical Trainer' }).lean();
    const commTrainers = await User.find({ role: 'Communication Trainer' }).lean();
    const aptiTrainers = await User.find({ role: 'Aptitude Trainer' }).lean();

    console.log('--- Existing Trainers Found ---');
    console.log('Technical:', techTrainers.map(t => t.email));
    console.log('Communication:', commTrainers.map(t => t.email));
    console.log('Aptitude:', aptiTrainers.map(t => t.email));

    if (techTrainers.length === 0 || commTrainers.length === 0 || aptiTrainers.length === 0) {
      console.error('CRITICAL: Missing one or more trainer roles in database. Please run create_admins_and_trainers.js first.');
      process.exit(1);
    }

    const defaultTechTrainerId = techTrainers[0]._id;
    const defaultCommTrainerId = commTrainers[0]._id;
    const defaultAptiTrainerId = aptiTrainers[0]._id;

    // 2. Fetch or create batches
    let techBatches = await Batch.find({ course: 'Technical Training' });
    if (techBatches.length === 0) {
      const b1 = await Batch.create({
        batchId: 'REACT-A',
        name: 'React JS Test Batch A',
        course: 'Technical Training',
        schedule: '09:00 AM - 11:00 AM (Mon - Fri)',
        status: 'Active',
        trainers: [defaultTechTrainerId],
        isTestData: true
      });
      const b2 = await Batch.create({
        batchId: 'NODE-A',
        name: 'Node JS Test Batch A',
        course: 'Technical Training',
        schedule: '11:00 AM - 01:00 PM (Mon - Fri)',
        status: 'Active',
        trainers: [defaultTechTrainerId],
        isTestData: true
      });
      techBatches = [b1, b2];
      console.log('Created Technical Test Batches: REACT-A, NODE-A');
    }

    let commBatches = await Batch.find({ course: 'Communication Skills' });
    if (commBatches.length === 0) {
      const b = await Batch.create({
        batchId: 'COMM-A',
        name: 'Communication Skills Test Batch A',
        course: 'Communication Skills',
        schedule: '02:00 PM - 04:00 PM (Mon - Fri)',
        status: 'Active',
        trainers: [defaultCommTrainerId],
        isTestData: true
      });
      commBatches = [b];
      console.log('Created Communication Test Batch: COMM-A');
    }

    let aptiBatches = await Batch.find({ course: 'Aptitude & Reasoning' });
    if (aptiBatches.length === 0) {
      const b = await Batch.create({
        batchId: 'APT-A',
        name: 'Aptitude Test Batch A',
        course: 'Aptitude & Reasoning',
        schedule: '04:00 PM - 06:00 PM (Mon - Fri)',
        status: 'Active',
        trainers: [defaultAptiTrainerId],
        isTestData: true
      });
      aptiBatches = [b];
      console.log('Created Aptitude Test Batch: APT-A');
    }

    console.log('--- Batches Used ---');
    console.log('Technical:', techBatches.map(b => b.batchId));
    console.log('Communication:', commBatches.map(b => b.batchId));
    console.log('Aptitude:', aptiBatches.map(b => b.batchId));

    // 3. Generate 100 test students
    console.log('Generating 100 test student user accounts & profiles...');
    const studentsToInsert = [];
    const studentProfilesToInsert = [];

    const salt = await bcrypt.genSalt(10);

    for (let i = 1; i <= 100; i++) {
      const idNum = 1000 + i; // 1001 to 1100
      const slaeId = `TEST${idNum}`;
      const name = `Test Student ${i}`;
      const email = `test${idNum}@lcp.com`;
      const mobile = `900000${idNum}`;
      
      const hashedPassword = await bcrypt.hash(slaeId, salt);
      
      const sId = new mongoose.Types.ObjectId();

      studentsToInsert.push({
        _id: sId,
        name,
        email,
        mobile,
        password: hashedPassword,
        role: 'Student',
        status: 'Active',
        slaeId,
        isTestData: true
      });

      studentProfilesToInsert.push({
        user: sId,
        collegeName: 'Test SLA Academy',
        degree: 'Bachelor of Technology',
        department: 'Information Technology',
        yearOfPassing: 2026,
        skills: ['JavaScript', 'HTML', 'CSS'],
        isTestData: true
      });
    }

    await User.collection.insertMany(studentsToInsert);
    await Student.collection.insertMany(studentProfilesToInsert);
    console.log(`Successfully inserted ${studentsToInsert.length} test students.`);

    // 4. Create Enrollments & update Batch student arrays
    console.log('Creating student batch enrollments...');
    const enrollmentsToInsert = [];
    const batchUpdates = {}; // batchId -> array of studentIds

    for (let i = 0; i < studentsToInsert.length; i++) {
      const student = studentsToInsert[i];

      // Assign Technical (distribute alternate)
      const techBatch = techBatches[i % techBatches.length];
      const techTrainerId = techBatch.trainers?.[0] || defaultTechTrainerId;
      enrollmentsToInsert.push({
        studentId: student._id,
        batchId: techBatch._id,
        trainerId: techTrainerId,
        department: 'Technical',
        course: techBatch.course,
        status: 'Active',
        enrolledAt: new Date(),
        isTestData: true
      });
      if (!batchUpdates[techBatch._id]) batchUpdates[techBatch._id] = [];
      batchUpdates[techBatch._id].push(student._id);

      // Assign Communication
      const commBatch = commBatches[i % commBatches.length];
      const commTrainerId = commBatch.trainers?.[0] || defaultCommTrainerId;
      enrollmentsToInsert.push({
        studentId: student._id,
        batchId: commBatch._id,
        trainerId: commTrainerId,
        department: 'Communication',
        course: commBatch.course,
        status: 'Active',
        enrolledAt: new Date(),
        isTestData: true
      });
      if (!batchUpdates[commBatch._id]) batchUpdates[commBatch._id] = [];
      batchUpdates[commBatch._id].push(student._id);

      // Assign Aptitude
      const aptiBatch = aptiBatches[i % aptiBatches.length];
      const aptiTrainerId = aptiBatch.trainers?.[0] || defaultAptiTrainerId;
      enrollmentsToInsert.push({
        studentId: student._id,
        batchId: aptiBatch._id,
        trainerId: aptiTrainerId,
        department: 'Aptitude',
        course: aptiBatch.course,
        status: 'Active',
        enrolledAt: new Date(),
        isTestData: true
      });
      if (!batchUpdates[aptiBatch._id]) batchUpdates[aptiBatch._id] = [];
      batchUpdates[aptiBatch._id].push(student._id);
    }

    await Enrollment.collection.insertMany(enrollmentsToInsert);
    console.log(`Successfully inserted ${enrollmentsToInsert.length} enrollment documents.`);

    // Bulk push students to Batch models
    for (const bId of Object.keys(batchUpdates)) {
      await Batch.findByIdAndUpdate(bId, {
        $addToSet: { students: { $each: batchUpdates[bId] } }
      });
    }
    console.log('Updated batch student lists.');

    // 5. Generate 15 Days Attendance History
    console.log('Generating 15 days of attendance history...');
    const attendanceToInsert = [];
    const statuses = ['Present', 'Absent', 'Late'];

    // Generate dates for the last 15 days
    const dates = [];
    for (let d = 0; d < 15; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      dates.push(date);
    }

    for (const student of studentsToInsert) {
      for (const date of dates) {
        // Find which technical batch the student is enrolled in
        const techBatch = techBatches[studentsToInsert.indexOf(student) % techBatches.length];

        // Random roll call status (75% present, 15% late, 10% absent)
        const rand = Math.random();
        const status = rand < 0.75 ? 'Present' : rand < 0.90 ? 'Late' : 'Absent';

        attendanceToInsert.push({
          student: student._id,
          batch: techBatch._id,
          date: date,
          status: status,
          remarks: status === 'Absent' ? 'Unexcused leave' : '',
          isTestData: true
        });
      }
    }

    await Attendance.collection.insertMany(attendanceToInsert);
    console.log(`Successfully inserted ${attendanceToInsert.length} attendance logs.`);

    // 6. Generate Scores
    console.log('Generating scorecard grades...');
    const scoresToInsert = [];

    const modules = [
      { name: 'React', category: 'Technical' },
      { name: 'Node', category: 'Technical' },
      { name: 'MongoDB', category: 'Technical' },
      { name: 'Public Speaking', category: 'Communication' },
      { name: 'Presentation', category: 'Communication' },
      { name: 'Reasoning', category: 'Aptitude' },
      { name: 'Quantitative Aptitude', category: 'Aptitude' }
    ];

    for (const student of studentsToInsert) {
      const idx = studentsToInsert.indexOf(student);
      const techBatch = techBatches[idx % techBatches.length];
      const commBatch = commBatches[idx % commBatches.length];
      const aptiBatch = aptiBatches[idx % aptiBatches.length];

      for (const mod of modules) {
        let bId = techBatch._id;
        let trainerId = defaultTechTrainerId;

        if (mod.category === 'Communication') {
          bId = commBatch._id;
          trainerId = defaultCommTrainerId;
        } else if (mod.category === 'Aptitude') {
          bId = aptiBatch._id;
          trainerId = defaultAptiTrainerId;
        }

        // Random marks 50 to 100
        const marks = Math.floor(Math.random() * 51) + 50;

        scoresToInsert.push({
          student: student._id,
          batch: bId,
          moduleName: mod.name,
          category: mod.category,
          marks: marks,
          status: 'Completed',
          remarks: marks >= 80 ? 'Excellent performance!' : 'Good effort, keep it up.',
          updatedBy: trainerId,
          isTestData: true
        });
      }
    }

    await Score.collection.insertMany(scoresToInsert);
    console.log(`Successfully inserted ${scoresToInsert.length} student scores.`);

    // 7. Generate Placement Pipeline Data
    console.log('Generating placement pipeline profiles...');
    const placementsToInsert = [];
    const placementStatuses = ['Pending', 'Interview Scheduled', 'Placed'];

    for (const student of studentsToInsert) {
      const randStatus = placementStatuses[Math.floor(Math.random() * placementStatuses.length)];
      placementsToInsert.push({
        student: student._id,
        resumeUploaded: Math.random() > 0.3,
        mockInterviewCompleted: Math.random() > 0.4,
        status: randStatus,
        appliedCompanies: [
          { companyName: 'Softlogic Solutions', position: 'Associate Software Engineer', status: randStatus === 'Placed' ? 'Offered' : 'Applied' },
          { companyName: 'Google Cloud Platform', position: 'Cloud Support Associate', status: 'Applied' }
        ],
        isTestData: true
      });
    }

    await Placement.collection.insertMany(placementsToInsert);
    console.log(`Successfully inserted ${placementsToInsert.length} placement logs.`);

    console.log('\n=============================================');
    console.log('📊 TEST DATA GENERATION SUCCESSFULLY COMPLETED');
    console.log('=============================================');
    console.log(`✓ Students Inserted   : ${studentsToInsert.length}`);
    console.log(`✓ Enrollments Created : ${enrollmentsToInsert.length}`);
    console.log(`✓ Attendance Logs     : ${attendanceToInsert.length}`);
    console.log(`✓ Module Scores       : ${scoresToInsert.length}`);
    console.log(`✓ Placement Pipelines : ${placementsToInsert.length}`);
    console.log('=============================================');

    mongoose.disconnect();
  } catch (error) {
    console.error('Test data generation failed:', error);
  }
};

generateTestData();
