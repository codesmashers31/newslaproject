import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");

    const staff = await User.find({ 
      role: { $in: ['Super Admin', 'Admin', 'Technical Trainer', 'Communication Trainer', 'Aptitude Trainer'] } 
    }).select('name email role').lean();
    
    console.log(`Found ${staff.length} staff members:`);
    staff.forEach(s => {
      console.log(`- Role: ${s.role} | Name: ${s.name} | Email: ${s.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Query failed:", error);
    process.exit(1);
  }
};

run();
