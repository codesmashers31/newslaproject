import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from './models/Batch.js';
import User from './models/User.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");

    const batches = await Batch.find()
      .select('name course trainers')
      .populate('trainers', 'name role email')
      .lean();

    console.log(`Found ${batches.length} batches:`);
    batches.forEach(b => {
      console.log(`\n- Batch: "${b.name}" | Course: "${b.course}"`);
      if (b.trainers && b.trainers.length > 0) {
        console.log(`  Trainers:`);
        b.trainers.forEach(t => {
          console.log(`    * ${t.role}: "${t.name}" (${t.email})`);
        });
      } else {
        console.log(`  Trainers: None assigned`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error("Query failed:", error);
    process.exit(1);
  }
};

run();
