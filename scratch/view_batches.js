import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from '../backend/models/Batch.js';

dotenv.config({ path: '../backend/.env' });

const view = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  const list = await Batch.find({}).lean();
  console.log('Batches in DB:', list.map(b => ({ id: b._id, name: b.name, course: b.course, studentsCount: b.students?.length })));
  mongoose.disconnect();
};

view();
