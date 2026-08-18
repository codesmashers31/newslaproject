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

const resetProductionDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not set in environment.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas for Production Database Reset...');
    await mongoose.connect(mongoUri);

    console.log('🧹 Wiping all test data collections...');

    // Delete test records
    await Promise.all([
      Student.deleteMany({}),
      Attendance.deleteMany({}),
      AttendanceSession.deleteMany({}),
      Score.deleteMany({}),
      Placement.deleteMany({}),
      Certificate.deleteMany({}),
      Notification.deleteMany({}),
      Enrollment.deleteMany({}),
      // Delete non-admin user accounts (keep Super Admin & Admin)
      User.deleteMany({ role: { $nin: ['Super Admin', 'Admin'] } })
    ]);

    console.log('✅ Wiped all student records, attendance logs, scores, and test accounts!');

    // Inspect remaining accounts
    const remainingAdmins = await User.find({ role: { $in: ['Super Admin', 'Admin'] } }).select('name email role');
    console.log('🛡️ Preserved Admin Accounts:', remainingAdmins);

    // Check if at least 1 Admin account exists, if not create default Admin
    if (remainingAdmins.length === 0) {
      const defaultAdmin = await User.create({
        name: 'SLA Super Admin',
        email: 'admin@slainstitute.com',
        mobile: '9876543210',
        password: 'password123',
        role: 'Super Admin',
        isApproved: true
      });
      console.log('🔑 Created Default Super Admin:', defaultAdmin.email);
    }

    console.log('🎉 Production database reset completed successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Database Reset Failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

resetProductionDB();
