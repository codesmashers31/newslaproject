import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Batch from '../models/Batch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/slaproject';

async function seedBatches() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Find trainers
  let mariya = await User.findOne({ email: 'mariya@sla.com' });
  if (!mariya) {
    mariya = await User.findOne({ name: /mariya/i, role: /communication/i });
  }

  let mariPriyan = await User.findOne({ email: 'mari@sla.com' });
  if (!mariPriyan) {
    mariPriyan = await User.findOne({ name: /mari/i, role: /aptitude/i });
  }

  console.log(`Found Communication Trainer Mariya: ${mariya ? mariya.name + ' (' + mariya._id + ')' : 'Not found'}`);
  console.log(`Found Aptitude Trainer MariPriyan: ${mariPriyan ? mariPriyan.name + ' (' + mariPriyan._id + ')' : 'Not found'}`);

  const commSchedules = [
    { name: 'Batch 1', schedule: '10:00 AM - 11:00 AM', batchId: 'COMM_BATCH_1' },
    { name: 'Batch 2', schedule: '11:00 AM - 12:00 PM', batchId: 'COMM_BATCH_2' },
    { name: 'Batch 3', schedule: '12:00 PM - 01:00 PM', batchId: 'COMM_BATCH_3' },
    { name: 'Batch 4', schedule: '01:00 PM - 02:00 PM', batchId: 'COMM_BATCH_4' },
    { name: 'Batch 5', schedule: '03:00 PM - 04:00 PM', batchId: 'COMM_BATCH_5' },
    { name: 'Batch 6', schedule: '04:00 PM - 05:00 PM', batchId: 'COMM_BATCH_6' },
  ];

  const aptiSchedules = [
    { name: 'Batch 1', schedule: '10:00 AM - 11:00 AM', batchId: 'APTI_BATCH_1' },
    { name: 'Batch 2', schedule: '11:00 AM - 12:00 PM', batchId: 'APTI_BATCH_2' },
    { name: 'Batch 3', schedule: '12:00 PM - 01:00 PM', batchId: 'APTI_BATCH_3' },
    { name: 'Batch 4', schedule: '02:00 PM - 03:00 PM', batchId: 'APTI_BATCH_4' },
    { name: 'Batch 5', schedule: '03:00 PM - 04:00 PM', batchId: 'APTI_BATCH_5' },
    { name: 'Batch 6', schedule: '04:00 PM - 05:00 PM', batchId: 'APTI_BATCH_6' },
  ];

  // 1. Create/Update Communication Batches
  for (const b of commSchedules) {
    const trainers = mariya ? [mariya._id] : [];
    await Batch.findOneAndUpdate(
      { batchId: b.batchId },
      {
        name: b.name,
        course: 'Communication Skills',
        batchId: b.batchId,
        schedule: b.schedule,
        trainers,
        trainerName: mariya ? mariya.name : 'Mariya',
        status: 'Active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Seeded Communication ${b.name} (${b.schedule}) -> Trainer: Mariya`);
  }

  // 2. Create/Update Aptitude Batches
  for (const b of aptiSchedules) {
    const trainers = mariPriyan ? [mariPriyan._id] : [];
    await Batch.findOneAndUpdate(
      { batchId: b.batchId },
      {
        name: b.name,
        course: 'Aptitude & Reasoning',
        batchId: b.batchId,
        schedule: b.schedule,
        trainers,
        trainerName: mariPriyan ? mariPriyan.name : 'MariPriyan',
        status: 'Active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Seeded Aptitude ${b.name} (${b.schedule}) -> Trainer: MariPriyan`);
  }

  console.log('\n--- ALL BATCHES SEEDED SUCCESSFULLY ---');
  const allBatches = await Batch.find().populate('trainers', 'name email role').lean();
  allBatches.forEach(b => {
    const trainerList = (b.trainers || []).map(t => t.name).join(', ') || b.trainerName || 'None';
    console.log(`- [${b.course}] ${b.name} (${b.schedule}) | Trainer: ${trainerList}`);
  });

  await mongoose.disconnect();
  console.log('\nDatabase connection closed.');
}

seedBatches().catch(err => {
  console.error('Seeding failed:', err);
  mongoose.disconnect();
});
