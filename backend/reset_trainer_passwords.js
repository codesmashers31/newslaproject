import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('MongoDB Connected.');

    const trainerEmails = [
      'mariya@sla.com',
      'mari@sla.com',
      'balasudhan17@gmail.com',
      'admin@lcp.com',
      'superadmin@lcp.com'
    ];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    for (const email of trainerEmails) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) {
        await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
        console.log(`Password reset successfully for: ${email} -> password123`);
      } else {
        console.log(`User not found in DB: ${email}`);
      }
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Password reset failed:', error);
  }
};

resetPasswords();
