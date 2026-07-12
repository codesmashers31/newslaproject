import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const list = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  const users = await User.find({}).lean();
  console.log('All Users in DB:', users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, slaeId: u.slaeId })));
  mongoose.disconnect();
};

list();
