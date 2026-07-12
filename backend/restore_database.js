import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import User from './models/User.js';
import Student from './models/Student.js';
import Placement from './models/Placement.js';
import Batch from './models/Batch.js';
import Score from './models/Score.js';
import Attendance from './models/Attendance.js';
import { syncStudentBatchesFromStrings } from './utils/trainerMapper.js';

dotenv.config();

const restore = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  
  console.log('Clearing existing student records (preserving Admins & Trainers)...');
  await User.deleteMany({ role: 'Student' });
  await Student.deleteMany();
  await Placement.deleteMany();
  await Score.deleteMany();
  await Attendance.deleteMany();
  
  // We can also clear batches to let them rebuild cleanly from Excel strings
  await Batch.deleteMany();
  console.log('Cleared students and batches.');

  const uploadsDir = './uploads';
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.xlsx'));
  
  const studentMap = {};

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (const row of data) {
      const rowKeys = Object.keys(row);
      const getVal = (possibleKeys) => {
        const matchingKey = rowKeys.find(k => {
          const cleanK = k.replace(/[\s\-_]+/g, '').toLowerCase();
          return possibleKeys.includes(cleanK);
        });
        return matchingKey ? String(row[matchingKey]).trim() : '';
      };

      const slaeId = getVal(['slaeid', 'eid', 'id', 'studentworkid', 'rollno', 'registerid']);
      const name = getVal(['name', 'studentname', 'fullname', 'username']);
      const techBatch = getVal(['batchid', 'batch', 'technicalbatchid', 'technicalbatch', 'techbatchid', 'techbatch']);
      const commBatch = getVal(['communicationbatchid', 'communicationbatch', 'commbatchid', 'commbatch', 'communicationbatchid']);
      const aptiBatch = getVal(['aptitudebatchid', 'aptitudebatch', 'aptibatchid', 'aptibatch', 'apptitutebatchid', 'apptitutebatch']);

      if (!slaeId) continue;

      const key = String(slaeId).trim();
      if (!studentMap[key]) {
        studentMap[key] = {
          slaeId: key,
          name: name || `Student ${key}`,
          technicalBatch: '',
          communicationBatch: '',
          aptitudeBatch: '',
        };
      }

      if (techBatch) studentMap[key].technicalBatch = techBatch;
      if (commBatch) studentMap[key].communicationBatch = commBatch;
      if (aptiBatch) studentMap[key].aptitudeBatch = aptiBatch;
    }
  }

  const studentsList = Object.values(studentMap);
  console.log(`Aggregated ${studentsList.length} unique student records from Excel sheets.`);

  let restoredCount = 0;
  for (const student of studentsList) {
    const email = `student${student.slaeId}@lcp.com`;
    
    // Create student User with password matching EID
    const user = await User.create({
      name: student.name,
      email,
      mobile: '9999999999',
      password: student.slaeId, // Password is EID
      role: 'Student',
      status: 'Active',
      slaeId: student.slaeId,
      technicalBatch: student.technicalBatch,
      communicationBatch: student.communicationBatch,
      aptitudeBatch: student.aptitudeBatch,
    });

    await Student.create({
      user: user._id,
      collegeName: 'SLA Institute',
      degree: 'B.Tech',
      department: 'Computer Science',
      yearOfPassing: '2025',
    });

    await Placement.create({ student: user._id });

    // Sync student to batches (this will auto-create missing batches in DB)
    await syncStudentBatchesFromStrings(user._id);
    restoredCount++;
  }

  // Assign default trainers to batches so they are not empty
  const trainers = await User.find({ role: { $in: ['Technical Trainer', 'Communication Trainer', 'Aptitude Trainer'] } });
  const techTrainer = trainers.find(t => t.role === 'Technical Trainer') || trainers[0];
  const commTrainer = trainers.find(t => t.role === 'Communication Trainer') || trainers[0];
  const aptiTrainer = trainers.find(t => t.role === 'Aptitude Trainer') || trainers[0];

  const allBatches = await Batch.find({});
  for (const batch of allBatches) {
    if (batch.course === 'Communication Skills' && commTrainer) {
      batch.trainers = [commTrainer._id];
    } else if (batch.course === 'Aptitude & Reasoning' && aptiTrainer) {
      batch.trainers = [aptiTrainer._id];
    } else if (techTrainer) {
      batch.trainers = [techTrainer._id];
    }
    await batch.save();
  }

  // Re-sync all students to resolve trainer names from updated batches
  const allStudentUsers = await User.find({ role: 'Student' });
  for (const stu of allStudentUsers) {
    await syncStudentBatchesFromStrings(stu._id);
  }

  console.log(`Successfully restored ${restoredCount} student profiles!`);
  mongoose.disconnect();
};

restore();
