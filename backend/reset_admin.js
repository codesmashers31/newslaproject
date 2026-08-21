import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Hash new password 'admin123'
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update both admin and superadmin to have 'admin123'
    await User.updateOne({ email: 'superadmin@lcp.com' }, { $set: { password: hashedPassword } });
    await User.updateOne({ email: 'admin@lcp.com' }, { $set: { password: hashedPassword } });
    
    console.log('Password reset successful to "admin123" for both superadmin@lcp.com and admin@lcp.com');
    mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
};

resetPassword();
