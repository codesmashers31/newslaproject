import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkMeena() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected...');

  const student = await User.findOne({ 
    $or: [
      { email: 'meena@sla.com' },
      { slaeId: 'SLA-1006' },
      { mobile: '9876543215' }
    ]
  });

  if (!student) {
    console.log('Student Meena R not found!');
  } else {
    console.log('Found Student:', {
      _id: student._id,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      slaeId: student.slaeId,
      role: student.role,
      status: student.status,
      passwordHash: student.password?.slice(0, 20) + '...'
    });

    const isMatchStudent123 = await bcrypt.compare('student123', student.password);
    const isMatchSlaeId = await bcrypt.compare('SLA-1006', student.password);
    const isMatchMobile = await bcrypt.compare('9876543215', student.password);

    console.log('Password check "student123":', isMatchStudent123);
    console.log('Password check "SLA-1006":', isMatchSlaeId);
    console.log('Password check "9876543215":', isMatchMobile);
  }

  await mongoose.disconnect();
}

checkMeena().catch(console.error);
