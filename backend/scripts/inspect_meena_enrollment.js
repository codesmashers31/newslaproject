import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function inspectMeenaEnrollment() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB...');

  const student = await User.findOne({ name: /Meena/i });
  if (!student) {
    console.log('Student Meena R not found');
    return;
  }

  console.log('\n--- Meena R User Record ---');
  console.log({
    id: student._id,
    name: student.name,
    email: student.email,
    createdAt: student.createdAt,
    communicationBatch: student.communicationBatch,
    aptitudeBatch: student.aptitudeBatch,
    technicalBatch: student.technicalBatch
  });

  const enrollments = await Enrollment.find({ studentId: student._id })
    .populate('batchId', 'name course startDate')
    .lean();

  console.log(`\n--- Enrollments for Meena R (${enrollments.length} found) ---`);
  enrollments.forEach((e, idx) => {
    console.log(`[Enrollment ${idx + 1}] Dept: ${e.department} | Batch: "${e.batchId?.name}" | Status: ${e.status} | startDate: ${e.startDate ? new Date(e.startDate).toISOString() : 'NULL'} | createdAt: ${new Date(e.createdAt).toISOString()} | completedAt: ${e.completedAt ? new Date(e.completedAt).toISOString() : 'NULL'}`);
  });

  await mongoose.disconnect();
}

inspectMeenaEnrollment().catch(console.error);
