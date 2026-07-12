import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  const allUsers = await User.find({}).lean();
  console.log('All Users in DB:', allUsers.map(u => ({ name: u.name, email: u.email, role: u.role })));
  mongoose.disconnect();
};

check();
