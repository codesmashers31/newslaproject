import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('MongoDB Connected for cleanup.');

    console.log('Removing legacy batch and trainer fields from all user records...');
    const result = await User.updateMany(
      {},
      {
        $unset: {
          technicalBatch: '',
          technicalTrainer: '',
          communicationBatch: '',
          communicationTrainer: '',
          aptitudeBatch: '',
          aptitudeTrainer: ''
        }
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} user records.`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

cleanup();
