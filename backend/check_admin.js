import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const allAdmins = await User.find({ role: { $in: ['Super Admin', 'Admin'] } }).lean();
    console.log('Admins in DB:', allAdmins.map(u => ({ email: u.email, role: u.role, name: u.name, pwd: u.password })));
    mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
};

check();
