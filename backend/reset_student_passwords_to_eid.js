import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const reset = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  const students = await User.find({ role: 'Student' });
  console.log(`Found ${students.length} students to check.`);
  let count = 0;
  for (const student of students) {
    if (student.slaeId) {
      student.password = student.slaeId;
      await student.save();
      console.log(`Password reset for student EID: ${student.slaeId} (Name: ${student.name})`);
      count++;
    }
  }
  console.log(`Successfully reset passwords for ${count} students to match their EID.`);
  mongoose.disconnect();
};

reset();
