import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");

    const students = await User.find({ 
      role: 'Student', 
      $or: [
        { technicalTrainer: { $ne: '' } },
        { communicationTrainer: { $ne: '' } },
        { aptitudeTrainer: { $ne: '' } }
      ]
    });
    
    console.log(`Found ${students.length} students with assigned trainers:`);
    students.forEach(s => {
      console.log({
        id: s._id,
        name: s.name,
        technicalTrainer: s.technicalTrainer,
        communicationTrainer: s.communicationTrainer,
        aptitudeTrainer: s.aptitudeTrainer
      });
    });

    process.exit(0);
  } catch (error) {
    console.error("Query failed:", error);
    process.exit(1);
  }
};

run();
