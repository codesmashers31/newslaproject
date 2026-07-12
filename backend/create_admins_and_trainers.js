import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('MongoDB Connected.');

    const accounts = [
      {
        name: 'Super Admin',
        email: 'superadmin@lcp.com',
        mobile: '9999999999',
        password: 'password123',
        role: 'Super Admin',
        status: 'Active'
      },
      {
        name: 'Batch Coordinator Admin',
        email: 'admin@lcp.com',
        mobile: '8888888888',
        password: 'password123',
        role: 'Admin',
        status: 'Active'
      },
      {
        name: 'Alan Turing',
        email: 'aptitude@lcp.com',
        mobile: '7777777777',
        password: 'password123',
        role: 'Aptitude Trainer',
        status: 'Active'
      },
      {
        name: 'Grace Hopper',
        email: 'communication@lcp.com',
        mobile: '6666666666',
        password: 'password123',
        role: 'Communication Trainer',
        status: 'Active'
      },
      {
        name: 'Linus Torvalds',
        email: 'technical@lcp.com',
        mobile: '5555555555',
        password: 'password123',
        role: 'Technical Trainer',
        status: 'Active'
      }
    ];

    for (const acc of accounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        await User.create(acc);
        console.log(`Created ${acc.role}: ${acc.email} / password123`);
      } else {
        console.log(`${acc.role} already exists: ${acc.email}`);
      }
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Failed to create accounts:', error);
  }
};

createAccounts();
