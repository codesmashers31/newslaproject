import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Student from './models/Student.js';
import Score from './models/Score.js';
import Attendance from './models/Attendance.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");

    // 1. Find all student user IDs
    const students = await User.find({ role: 'Student' }).select('_id').lean();
    const studentIds = students.map(s => s._id);

    console.log(`Found ${studentIds.length} students to delete.`);

    if (studentIds.length === 0) {
      console.log("No student records found to delete.");
      process.exit(0);
    }

    // 2. Delete related records
    const profileDel = await Student.deleteMany({ user: { $in: studentIds } });
    console.log(`Deleted ${profileDel.deletedCount} student profile documents.`);

    const scoreDel = await Score.deleteMany({ student: { $in: studentIds } });
    console.log(`Deleted ${scoreDel.deletedCount} score records.`);

    const attendanceDel = await Attendance.deleteMany({ student: { $in: studentIds } });
    console.log(`Deleted ${attendanceDel.deletedCount} attendance logs.`);

    // 3. Delete the users themselves
    const userDel = await User.deleteMany({ role: 'Student' });
    console.log(`Deleted ${userDel.deletedCount} student user accounts.`);

    console.log("Database cleanup completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Database cleanup failed:", error);
    process.exit(1);
  }
};

run();
