import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Student from './models/Student.js';
import Placement from './models/Placement.js';
import Batch from './models/Batch.js';
import { syncStudentBatchesFromStrings } from './utils/trainerMapper.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  
  // 1. Create Trainers if they don't exist
  let trainer = await User.findOne({ email: 'communication@lcp.com' });
  if (!trainer) {
    trainer = await User.create({
      name: 'Grace Hopper',
      email: 'communication@lcp.com',
      mobile: '6666666666',
      password: 'password123',
      role: 'Communication Trainer',
      status: 'Active'
    });
  }

  // 2. Create student 5810
  console.log('Creating student 5810...');
  let studentUser = await User.findOne({ slaeId: '5810' });
  if (studentUser) {
    await User.deleteOne({ _id: studentUser._id });
    await Student.deleteOne({ user: studentUser._id });
    await Placement.deleteOne({ student: studentUser._id });
  }

  studentUser = await User.create({
    name: 'Janani',
    email: 'janani@lcp.com',
    mobile: '9876545810',
    password: '5810', // Password is EID 5810
    role: 'Student',
    status: 'Active',
    slaeId: '5810',
    communicationBatch: 'BATCH 1',
    communicationTrainer: 'Grace Hopper'
  });

  await Student.create({
    user: studentUser._id,
    collegeName: 'SLA Institute',
    degree: 'B.Tech',
    department: 'Information Technology',
    yearOfPassing: '2025',
    gender: 'Female',
    skills: ['Communication', 'English Foundations'],
    bio: 'Learning career progress tracker student.',
  });

  await Placement.create({
    student: studentUser._id,
    resumeUploaded: false,
    mockInterviewCompleted: false,
    status: 'Not Started'
  });

  // 3. Sync student batches to auto-create BATCH 1 in the database
  await syncStudentBatchesFromStrings(studentUser._id);

  // 4. Update the newly created batch BATCH 1 to have Grace Hopper as its trainer
  const batchObj = await Batch.findOne({ name: 'BATCH 1' });
  if (batchObj) {
    batchObj.trainers = [trainer._id];
    await batchObj.save();
    console.log('Successfully assigned Grace Hopper as trainer for BATCH 1.');
  }

  // Re-sync to resolve trainer names on the user profile
  await syncStudentBatchesFromStrings(studentUser._id);

  console.log('Database initialized successfully! You can now log in with EID: 5810 and Password: 5810.');
  mongoose.disconnect();
};

run();
