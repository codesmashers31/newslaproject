import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Score from '../models/Score.js';
import Placement from '../models/Placement.js';
import Certificate from '../models/Certificate.js';
import Notification from '../models/Notification.js';
import Enrollment from '../models/Enrollment.js';

const realStudentsData = [
  // Image 1 (59 records)
  { eid: 'EID_26_006962', name: 'Gokul' },
  { eid: 'EID_26_006768', name: 'Arun.S' },
  { eid: 'EID_26_006730', name: 'D.DHINESH KUMAR' },
  { eid: 'EID_26_006776', name: 'AKASH S' },
  { eid: 'EID_26_006845', name: 'R.Janani' },
  { eid: 'EID_26_006777', name: 'ANBU A' },
  { eid: 'EID_26_006780', name: 'Pukazhenthi.A' },
  { eid: 'EID_26_006898', name: 'Suvalakshmi v' },
  { eid: 'EID_26_006879', name: 'Jayanth E S' },
  { eid: 'EID_26_006779', name: 'Vishwa' },
  { eid: 'EID_26_006725', name: 'Heman Raj S' },
  { eid: 'EID_26_006818', name: 'Arun Sabharish M' },
  { eid: 'EID_26_006892', name: 'Vinothkumar R' },
  { eid: 'EID_26_006731', name: 'Mohan S' },
  { eid: 'EID_26_006734', name: 'Chethan' },
  { eid: 'EID_26_006647', name: 'Gayathri G' },
  { eid: 'EID_26_006795', name: 'rithika' },
  { eid: 'EID_26_006844', name: 'Rajitha K' },
  { eid: 'EID_26_006868', name: 'Thanuja R' },
  { eid: 'EID_26_006767', name: 'SYED NISAR AHAMED .S' },
  { eid: 'EID_26_006848', name: 'Vishnu Ravichandran' },
  { eid: 'EID_26_006192', name: 'Mathan M D' },
  { eid: 'EID_26_006753', name: 'S.Sonia' },
  { eid: 'EID_26_006787', name: 'Sanjay M' },
  { eid: 'EID_26_006666', name: 'Tejeswari J' },
  { eid: 'EID_26_006815', name: 'Tabasiya A' },
  { eid: 'EID_26_006789', name: 'Ashvi R' },
  { eid: 'EID_26_006846', name: 'Gowtham Krishnan R' },
  { eid: 'EID_26_006714', name: 'Harish S' },
  { eid: 'EID_26_006692', name: 'Bhaarath M' },
  { eid: 'EID_26_006599', name: 'dhanasekar' },
  { eid: 'EID_26_006361', name: 'N.Vignesh' },
  { eid: 'EID_26_005863', name: 'R.K. Tharun' },
  { eid: 'EID_26_006820', name: 'Saswath S' },
  { eid: 'EID_26_006773', name: 'Renita Amala Rani J' },
  { eid: 'EID_26_006775', name: 'SURYA V' },
  { eid: 'EID_26_006801', name: 'Jeya Surya K' },
  { eid: 'EID_26_006605', name: 'Abiseik P' },
  { eid: 'EID_26_006339', name: 'SRIAKASH.S' },
  { eid: 'EID_26_006819', name: 'Dhanalakshmi A' },
  { eid: 'EID_26_006772', name: 'JANARTHANAN R' },
  { eid: 'EID_26_006724', name: 'Dhanaseelan.M' },
  { eid: 'EID_26_006525', name: 'Dhayapradeep B' },
  { eid: 'EID_26_006417', name: 'Naveen. P' },
  { eid: 'EID_26_005870', name: 'Dhanush' },
  { eid: 'EID_26_006796', name: 'A.Anbupriya' },
  { eid: 'EID_26_006602', name: 'A.Sathya' },
  { eid: 'EID_26_006486', name: 'R. Bhuvaneswaran' },
  { eid: 'EID_26_006359', name: 'Bharathi M' },
  { eid: 'EID_26_006814', name: 'Praveen G' },
  { eid: 'EID_26_006802', name: 'S.NAVEEN' },
  { eid: 'EID_26_006766', name: 'Santhosh kumar S' },
  { eid: 'EID_26_006740', name: 'Abdulmajid K' },
  { eid: 'EID_26_006622', name: 'GOPINATH JM' },
  { eid: 'EID_26_006360', name: 'Thamizhselvan S' },
  { eid: 'EID_26_006810', name: 'Vishal' },
  { eid: 'EID_26_006757', name: 'Monica K' },
  { eid: 'EID_26_006424', name: 'Akash Y' },
  { eid: 'EID_26_006154', name: 'Janani' },

  // Image 2 (26 records)
  { eid: 'EID_26_005586', name: 'Nandha' },
  { eid: 'EID_26_007101', name: 'QUINCY MEDONA V' },
  { eid: 'EID_26_007100', name: 'Arockia Jenifer P' },
  { eid: 'EID_26_007319', name: 'Prakash' },
  { eid: 'EID_26_007388', name: 'Sarjith' },
  { eid: 'EID_24_002702', name: 'Kavin prabhu S' },
  { eid: 'EID_26_007349', name: 'singaravelan c' },
  { eid: 'EID_26_006392', name: 'Riswana Barvin B' },
  { eid: 'EID_26_006658', name: 'Abinaya R' },
  { eid: 'EID_26_007350', name: 'Pugazhmani m' },
  { eid: 'EID_26_006578', name: 'Nivedhitha KR' },
  { eid: 'EID_26_007266', name: 'Arokia Romero Princy P' },
  { eid: 'EID_26_007265', name: 'DHINESH KUMAR R' },
  { eid: 'EID_26_007178', name: 'P. Senthil Kumaran' },
  { eid: 'EID_26_007177', name: 'S.PURUSOTHAMAN' },
  { eid: 'EID_26_007176', name: 'S. Vijaya Kumar' },
  { eid: 'EID_26_007175', name: 'S.MAYA KRISHNAN' },
  { eid: 'EID_26_007200', name: 'S.SATHYA' },
  { eid: 'EID_26_007149', name: 'T. Catherine' },
  { eid: 'EID_26_007124', name: 'D Nathiya' },
  { eid: 'EID_26_006896', name: 'Riyas' },
  { eid: 'EID_26_005642', name: 'NaveenKumar' },
  { eid: 'EID_26_007099', name: 'G.Manooj' },
  { eid: 'EID_26_006981', name: 'Deepak D' },
  { eid: 'EID_26_006942', name: 'SAMUVEL SHERBIN.P' },
  { eid: 'EID_26_006857', name: 'Maheshwaran s' }
];

const masterCleanSetup = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not set');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    // STEP 1: WIPE ALL COLLECTIONS COMPLETELY (Keep only Super Admin & Admin)
    console.log('\n🧹 STEP 1: Wiping all existing collections...');
    await Promise.all([
      Student.deleteMany({}),
      Batch.deleteMany({}),
      Attendance.deleteMany({}),
      AttendanceSession.deleteMany({}),
      Score.deleteMany({}),
      Placement.deleteMany({}),
      Certificate.deleteMany({}),
      Notification.deleteMany({}),
      Enrollment.deleteMany({}),
      User.deleteMany({ role: { $nin: ['Super Admin', 'Admin'] } })
    ]);
    console.log('✅ Step 1 Complete: All student logs, batches, enrollments, and test users wiped!');

    // STEP 2: CREATE 3 TRAINERS FIRST
    console.log('\n👨‍🏫 STEP 2: Creating 3 Trainers...');
    const techTrainer = await User.create({
      name: 'Balamugunthan S',
      email: 'slatrainer2@gmail.com',
      mobile: '9840123456',
      password: 'trainer123',
      role: 'Technical Trainer',
      isApproved: true
    });

    const aptiTrainer = await User.create({
      name: 'Mari Priyan',
      email: 'maripriyan@slainstitute.com',
      mobile: '9840234567',
      password: 'trainer123',
      role: 'Aptitude Trainer',
      isApproved: true
    });

    const commTrainer = await User.create({
      name: 'Maariya',
      email: 'maariya@slainstitute.com',
      mobile: '9840345678',
      password: 'trainer123',
      role: 'Communication Trainer',
      isApproved: true
    });

    console.log(`  + Technical Trainer created: ${techTrainer.name} (${techTrainer.email})`);
    console.log(`  + Aptitude Trainer created: ${aptiTrainer.name} (${aptiTrainer.email})`);
    console.log(`  + Communication Trainer created: ${commTrainer.name} (${commTrainer.email})`);

    // STEP 3: CREATE BATCHES & ALLOCATE TO TRAINERS
    console.log('\n📦 STEP 3: Creating 14 Batches and linking to Trainer IDs...');

    const techBatches = [
      {
        batchId: 'SLAKKN_FE_200826',
        name: 'Frontend-Batch 12-02',
        course: 'Frontend Development',
        department: 'Technical',
        startDate: new Date('2026-08-20'),
        endDate: new Date('2026-11-13'),
        startTime: '12:00 PM',
        endTime: '02:00 PM',
        schedule: 'Mon - Fri • 12:00 PM – 02:00 PM',
        trainers: [techTrainer._id],
        trainerName: techTrainer.name,
        technicalTrainer: techTrainer._id
      },
      {
        batchId: 'SLAKKN_FE_060726',
        name: 'Frontend-Batch 8-10',
        course: 'Frontend Development',
        department: 'Technical',
        startDate: new Date('2026-07-06'),
        endDate: new Date('2026-09-30'),
        startTime: '08:00 AM',
        endTime: '10:00 AM',
        schedule: 'Mon - Fri • 08:00 AM – 10:00 AM',
        trainers: [techTrainer._id],
        trainerName: techTrainer.name,
        technicalTrainer: techTrainer._id
      }
    ];

    const aptiTimes = [
      { start: '10:00 AM', end: '11:00 AM', num: 1 },
      { start: '11:00 AM', end: '12:00 PM', num: 2 },
      { start: '12:00 PM', end: '01:00 PM', num: 3 },
      { start: '02:00 PM', end: '03:00 PM', num: 4 },
      { start: '03:00 PM', end: '04:00 PM', num: 5 },
      { start: '04:00 PM', end: '05:00 PM', num: 6 }
    ];

    const aptiBatches = aptiTimes.map(t => ({
      batchId: `SLAKKN_APTI_B${t.num}`,
      name: `Aptitude Batch ${t.num} (${t.start}-${t.end})`,
      course: 'Aptitude & Reasoning',
      department: 'Aptitude',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-12-31'),
      startTime: t.start,
      endTime: t.end,
      schedule: `Mon - Fri • ${t.start} – ${t.end}`,
      trainers: [aptiTrainer._id],
      trainerName: aptiTrainer.name,
      aptitudeTrainer: aptiTrainer._id
    }));

    const commTimes = [
      { start: '10:00 AM', end: '11:00 AM', num: 1 },
      { start: '11:00 AM', end: '12:00 PM', num: 2 },
      { start: '12:00 PM', end: '01:00 PM', num: 3 },
      { start: '01:00 PM', end: '02:00 PM', num: 4 },
      { start: '03:00 PM', end: '04:00 PM', num: 5 },
      { start: '04:00 PM', end: '05:00 PM', num: 6 }
    ];

    const commBatches = commTimes.map(t => ({
      batchId: `SLAKKN_COMM_B${t.num}`,
      name: `Communication Batch ${t.num} (${t.start}-${t.end})`,
      course: 'Communication Skills',
      department: 'Communication',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-11-30'),
      startTime: t.start,
      endTime: t.end,
      schedule: `Mon - Fri • ${t.start} – ${t.end}`,
      trainers: [commTrainer._id],
      trainerName: commTrainer.name,
      communicationTrainer: commTrainer._id
    }));

    const allBatches = [...techBatches, ...aptiBatches, ...commBatches];
    await Batch.insertMany(allBatches);
    console.log(`✅ Step 3 Complete: ${allBatches.length} Batches created and allocated to correct Trainers!`);

    // STEP 4: SEED 85 REAL STUDENTS (UNASSIGNED)
    console.log('\n🎓 STEP 4: Seeding 85 Real Students (Unassigned)...');
    let studentCount = 0;
    for (const item of realStudentsData) {
      const email = `${item.eid.toLowerCase()}@slainstitute.com`;
      const mobile = `9840${Math.floor(100050 + Math.random() * 899900)}`;

      const user = await User.create({
        name: item.name,
        email,
        mobile,
        password: 'student123',
        role: 'Student',
        isApproved: true
      });

      await Student.create({
        user: user._id,
        studentId: item.eid,
        collegeName: 'SLA Institute',
        status: 'Active'
      });
      studentCount++;
    }

    console.log(`✅ Step 4 Complete: ${studentCount} Real Students created with unassigned courses!`);
    console.log('\n🎉 MASTER CLEAN SETUP COMPLETE SUCCESSFULLY!');
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Master Setup Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

masterCleanSetup();
