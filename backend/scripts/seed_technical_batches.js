import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Batch from '../models/Batch.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedTechnicalBatches() {
  console.log('========================================================================');
  console.log('         SEEDING TECHNICAL BATCHES FOR STUDENT SELECTION                ');
  console.log('========================================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  const trainer = await User.findOne({ role: 'Technical Trainer' });
  const trainerId = trainer ? trainer._id : null;

  const techBatchesToCreate = [
    {
      name: 'Java Full Stack - Batch 1',
      course: 'Java Full Stack Development',
      batchId: 'TECH_JAVA_1',
      schedule: '09:00 AM - 11:00 AM',
      startTime: '09:00 AM',
      endTime: '11:00 AM',
      status: 'Active',
      trainers: trainerId ? [trainerId] : []
    },
    {
      name: 'Python Full Stack - Batch 1',
      course: 'Python Full Stack Development',
      batchId: 'TECH_PY_1',
      schedule: '11:30 AM - 01:30 PM',
      startTime: '11:30 AM',
      endTime: '01:30 PM',
      status: 'Active',
      trainers: trainerId ? [trainerId] : []
    },
    {
      name: 'MERN Stack Web Dev - Batch 1',
      course: 'MERN Stack Web Development',
      batchId: 'TECH_MERN_1',
      schedule: '02:00 PM - 04:00 PM',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      status: 'Active',
      trainers: trainerId ? [trainerId] : []
    },
    {
      name: 'AWS Cloud & DevOps - Batch 1',
      course: 'AWS Cloud & DevOps Engineering',
      batchId: 'TECH_AWS_1',
      schedule: '04:30 PM - 06:30 PM',
      startTime: '04:30 PM',
      endTime: '06:30 PM',
      status: 'Active',
      trainers: trainerId ? [trainerId] : []
    }
  ];

  for (const item of techBatchesToCreate) {
    await Batch.findOneAndUpdate(
      { batchId: item.batchId },
      item,
      { upsert: true, new: true }
    );
    console.log(`✅ Upserted Technical Batch: ${item.name} (${item.batchId})`);
  }

  console.log('\n========================================================================');
  await mongoose.disconnect();
}

seedTechnicalBatches().catch(console.error);
