import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { syncStudentBatchesFromStrings } from './utils/trainerMapper.js';

dotenv.config();

const sync = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  const students = await User.find({ role: 'Student' });
  console.log(`Found ${students.length} students to sync.`);
  for (const student of students) {
    await syncStudentBatchesFromStrings(student._id);
  }
  console.log('All student batches and trainers successfully synchronized.');
  mongoose.disconnect();
};

sync();
