import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import AptitudeModule from '../models/AptitudeModule.js';
import CommunicationModule from '../models/CommunicationModule.js';
import TechnicalModule from '../models/TechnicalModule.js';
import Student from '../models/Student.js';
import Placement from '../models/Placement.js';
import Batch from '../models/Batch.js';
import Score from '../models/Score.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

const aptitudeModules = [
  'Vedic Math/Simplification',
  'Ratio and proportion/HCF and LCM',
  'Percentage',
  'Ages/Average',
  'Time and work/pipes and cistern',
  'Time speed distance',
  'Problem based on Train and Boats and stream',
  'Directions',
  'Alphabet Test/Letter series/Coding&decoding',
  'MOT/Syllogism',
  'Blood Relations',
  'Seating arrangements/puzzles',
  'Profit and loss',
  'Simple interest',
  'Compound interest',
  'Permutation and combination / Probability'
];

const communicationModules = [
  'Communication Foundations',
  'English Fundamentals',
  'Soft Skills Development',
  'Public Speaking Excellence',
  'Business Communication',
  'Interview preparation and Employability Skills',
  'Pronunciation & Accent enhancement',
  'Technical presentations',
  'Attitude and corporate behaviour',
  'Digital Etiquette',
  'Global Communication'
];

const technicalModules = [
  'HTML',
  'CSS',
  'JavaScript',
  'Bootstrap',
  'React',
  'Node.js',
  'Express.js',
  'MongoDB',
  'Git',
  'REST API',
  'Mini Project',
  'Major Project',
  'Mock Interview',
  'Technical Interview'
];

const seedData = async () => {
  try {
    await connectDB();

    // 1. Clear existing module lists
    await AptitudeModule.deleteMany();
    await CommunicationModule.deleteMany();
    await TechnicalModule.deleteMany();

    console.log('Cleared existing modules.');

    // 2. Insert Aptitude Modules
    const aptDocs = aptitudeModules.map((name, index) => ({ name, order: index + 1 }));
    await AptitudeModule.insertMany(aptDocs);
    console.log(`Seeded ${aptDocs.length} Aptitude modules.`);

    // 3. Insert Communication Modules
    const commDocs = communicationModules.map((name, index) => ({ name, order: index + 1 }));
    await CommunicationModule.insertMany(commDocs);
    console.log(`Seeded ${commDocs.length} Communication modules.`);

    // 4. Insert Technical Modules
    const techDocs = technicalModules.map((name, index) => ({ name, order: index + 1 }));
    await TechnicalModule.insertMany(techDocs);
    console.log(`Seeded ${techDocs.length} Technical modules.`);

    // 5. Clear and Seed All Users, Batches, Student profiles, Placements, Scores, Attendance
    console.log('Clearing existing users, batches, student profiles, scores, and attendance...');
    await User.deleteMany();
    await Student.deleteMany();
    await Placement.deleteMany();
    await Batch.deleteMany();
    await Score.deleteMany();
    await Attendance.deleteMany();

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin Executive',
      email: 'superadmin@lcp.com',
      mobile: '9999999999',
      password: 'password123',
      role: 'Super Admin',
      status: 'Active'
    });
    console.log('Seeded Super Admin user (superadmin@lcp.com / password123)');

    // Create Admin
    const admin = await User.create({
      name: 'Batch Coordinator Admin',
      email: 'admin@lcp.com',
      mobile: '8888888888',
      password: 'password123',
      role: 'Admin',
      status: 'Active'
    });
    console.log('Seeded Admin user (admin@lcp.com / password123)');

    // Create Trainers
    const aptitudeTrainer = await User.create({
      name: 'Alan Turing',
      email: 'aptitude@lcp.com',
      mobile: '7777777777',
      password: 'password123',
      role: 'Aptitude Trainer',
      status: 'Active'
    });
    console.log('Seeded Aptitude Trainer (aptitude@lcp.com / password123)');

    const communicationTrainer = await User.create({
      name: 'Grace Hopper',
      email: 'communication@lcp.com',
      mobile: '6666666666',
      password: 'password123',
      role: 'Communication Trainer',
      status: 'Active'
    });
    console.log('Seeded Communication Trainer (communication@lcp.com / password123)');

    const technicalTrainer = await User.create({
      name: 'Linus Torvalds',
      email: 'technical@lcp.com',
      mobile: '5555555555',
      password: 'password123',
      role: 'Technical Trainer',
      status: 'Active'
    });
    console.log('Seeded Technical Trainer (technical@lcp.com / password123)');

    // Create Students
    const student1 = await User.create({
      name: 'John Doe',
      email: 'student@lcp.com',
      mobile: '1234567890',
      password: 'password123',
      role: 'Student',
      status: 'Active'
    });
    await Student.create({
      user: student1._id,
      collegeName: 'Stanford University',
      degree: 'B.Tech',
      department: 'Computer Science',
      yearOfPassing: '2027',
      gender: 'Male',
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Frontend Development'],
      bio: 'Enthusiastic developer looking for frontend engineering roles.',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      resumeUrl: '/uploads/johndoe_resume.pdf'
    });
    await Placement.create({
      student: student1._id,
      resumeUploaded: true,
      mockInterviewCompleted: true,
      status: 'Pending'
    });
    console.log('Seeded Student 1 (student@lcp.com / password123)');

    const student2 = await User.create({
      name: 'Alice Smith',
      email: 'alice@lcp.com',
      mobile: '9876543210',
      password: 'password123',
      role: 'Student',
      status: 'Active'
    });
    await Student.create({
      user: student2._id,
      collegeName: 'MIT',
      degree: 'B.Sc',
      department: 'Mathematics',
      yearOfPassing: '2026',
      gender: 'Female',
      skills: ['Python', 'Data Structures', 'Algorithms'],
      bio: 'Aptitude specialist transitioning to full stack engineering.',
      linkedin: 'https://linkedin.com/in/alicesmith',
      github: 'https://github.com/alicesmith',
      resumeUrl: '/uploads/alicesmith_resume.pdf'
    });
    await Placement.create({
      student: student2._id,
      resumeUploaded: true,
      mockInterviewCompleted: false,
      status: 'Not Started'
    });
    console.log('Seeded Student 2 (alice@lcp.com / password123)');

    // Create Batch
    const batch = await Batch.create({
      name: 'Elite Full Stack Web Dev Batch A',
      course: 'MERN Full Stack & Placement Track',
      trainers: [aptitudeTrainer._id, communicationTrainer._id, technicalTrainer._id],
      students: [student1._id, student2._id],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 1 month ago
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });
    console.log('Seeded Batch: Elite Full Stack Web Dev Batch A');

    // Seed student scores
    const seedStudentScores = async (studentId, list, category) => {
      for (let i = 0; i < list.length; i++) {
        // Mark first 60% as Completed/Mastered, rest as Not Started or In Progress
        let status = 'Not Started';
        let marks = 0;
        let remarks = '';
        if (i < Math.floor(list.length * 0.5)) {
          status = i % 2 === 0 ? 'Mastered' : 'Completed';
          marks = Math.floor(Math.random() * 3) + 8; // 8, 9, 10
          remarks = 'Excellent logical reasoning and execution.';
        } else if (i < Math.floor(list.length * 0.7)) {
          status = 'In Progress';
          marks = Math.floor(Math.random() * 3) + 5; // 5, 6, 7
          remarks = 'Progressing well, requires some practice.';
        }

        if (status !== 'Not Started') {
          await Score.create({
            student: studentId,
            moduleName: list[i],
            category,
            status,
            marks,
            remarks,
            updatedBy: technicalTrainer._id // mock grader
          });
        }
      }
    };

    await seedStudentScores(student1._id, aptitudeModules, 'Aptitude');
    await seedStudentScores(student1._id, communicationModules, 'Communication');
    await seedStudentScores(student1._id, technicalModules, 'Technical');

    await seedStudentScores(student2._id, aptitudeModules, 'Aptitude');
    await seedStudentScores(student2._id, communicationModules, 'Communication');
    await seedStudentScores(student2._id, technicalModules, 'Technical');
    console.log('Seeded student module scores');

    // Seed some mock attendance
    const seedStudentAttendance = async (studentId) => {
      // Loop over last 15 days
      for (let d = 15; d >= 0; d--) {
        const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        date.setHours(0,0,0,0);
        
        let status = 'Present';
        if (d === 5) status = 'Absent';
        else if (d === 10) status = 'Late';

        await Attendance.create({
          student: studentId,
          batch: batch._id,
          date,
          status,
          markedBy: technicalTrainer._id
        });
      }
    };

    await seedStudentAttendance(student1._id);
    await seedStudentAttendance(student2._id);
    console.log('Seeded mock attendance logs');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
