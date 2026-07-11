import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Batch from './models/Batch.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected.");

    const batches = await Batch.find().select('name course').lean();
    console.log(`Found ${batches.length} batches:`);
    batches.forEach(b => {
      console.log(`- Batch Name: "${b.name}" | Course/Domain: "${b.course}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Query failed:", error);
    process.exit(1);
  }
};

run();
