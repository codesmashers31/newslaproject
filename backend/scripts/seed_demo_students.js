import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDemoStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');

    // Find Mariya and MariPriyan
    const mariya = await User.findOne({ email: 'mariya@sla.com' });
    const maripriyan = await User.findOne({ email: 'mari@sla.com' });

    if (!mariya || !maripriyan) {
      console.log('Trainers not found!');
      process.exit(1);
    }

    // Find batches
    const commBatches = await Batch.find({ course: 'Communication Skills' });
    const aptiBatches = await Batch.find({ course: 'Aptitude & Reasoning' });

    console.log(`Found ${commBatches.length} Communication batches and ${aptiBatches.length} Aptitude batches.`);

    // Demo student details
    const studentData = [
      { name: 'Arun Kumar', email: 'arun@sla.com', mobile: '9876543210', slaeId: 'SLA-1001' },
      { name: 'Priya Sharma', email: 'priya@sla.com', mobile: '9876543211', slaeId: 'SLA-1002' },
      { name: 'Karthik Raja', email: 'karthik@sla.com', mobile: '9876543212', slaeId: 'SLA-1003' },
      { name: 'Divya N', email: 'divya@sla.com', mobile: '9876543213', slaeId: 'SLA-1004' },
      { name: 'Sanjay V', email: 'sanjay@sla.com', mobile: '9876543214', slaeId: 'SLA-1005' },
      { name: 'Meena R', email: 'meena@sla.com', mobile: '9876543215', slaeId: 'SLA-1006' }
    ];

    const hashedPassword = await bcrypt.hash('student123', 10);

    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i];
      let student = await User.findOne({ email: s.email });
      if (!student) {
        student = await User.create({
          name: s.name,
          email: s.email,
          password: hashedPassword,
          role: 'Student',
          mobile: s.mobile,
          slaeId: s.slaeId,
          status: 'Active',
          communicationBatch: commBatches[i % commBatches.length]?.name || 'Batch 1',
          communicationTrainer: mariya.name,
          aptitudeBatch: aptiBatches[i % aptiBatches.length]?.name || 'Batch 1',
          aptitudeTrainer: maripriyan.name
        });
        console.log(`Created student: ${student.name} (${student.slaeId})`);
      }

      // Assign student to Comm batch
      const commBatch = commBatches[i % commBatches.length];
      if (commBatch && !commBatch.students.includes(student._id)) {
        commBatch.students.push(student._id);
        await commBatch.save();
      }

      // Assign student to Apti batch
      const aptiBatch = aptiBatches[i % aptiBatches.length];
      if (aptiBatch && !aptiBatch.students.includes(student._id)) {
        aptiBatch.students.push(student._id);
        await aptiBatch.save();
      }

      // Create Communication Enrollment
      if (commBatch) {
        await Enrollment.findOneAndUpdate(
          { studentId: student._id, department: 'Communication' },
          { studentId: student._id, batchId: commBatch._id, trainerId: mariya._id, department: 'Communication', status: 'Active' },
          { upsert: true }
        );
      }

      // Create Aptitude Enrollment
      if (aptiBatch) {
        await Enrollment.findOneAndUpdate(
          { studentId: student._id, department: 'Aptitude' },
          { studentId: student._id, batchId: aptiBatch._id, trainerId: maripriyan._id, department: 'Aptitude', status: 'Active' },
          { upsert: true }
        );
      }
    }

    console.log('Demo students seeded and assigned successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo students:', err);
    process.exit(1);
  }
};

seedDemoStudents();
