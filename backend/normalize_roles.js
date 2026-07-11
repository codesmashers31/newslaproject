import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");

    // Update lowercase 'student' to 'Student'
    const result = await User.updateMany(
      { role: 'student' },
      { $set: { role: 'Student' } }
    );
    
    console.log(`Successfully normalized ${result.modifiedCount} student roles.`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

run();
