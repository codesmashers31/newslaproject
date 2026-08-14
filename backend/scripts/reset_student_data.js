import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Score from '../models/Score.js';
import Placement from '../models/Placement.js';
import Assignment from '../models/Assignment.js';
import Certificate from '../models/Certificate.js';
import DeviceResetRequest from '../models/DeviceResetRequest.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/slaproject';

async function resetData() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // 1. Delete all student users
  const deletedStudents = await User.deleteMany({ role: 'Student' });
  console.log(`Deleted ${deletedStudents.deletedCount} Student user accounts.`);

  // 2. Clear student profile info
  const deletedProfiles = await Student.deleteMany({});
  console.log(`Cleared ${deletedProfiles.deletedCount} Student profiles.`);

  // 3. Clear batches
  const deletedBatches = await Batch.deleteMany({});
  console.log(`Cleared ${deletedBatches.deletedCount} Batches.`);

  // 4. Clear enrollments
  const deletedEnrollments = await Enrollment.deleteMany({});
  console.log(`Cleared ${deletedEnrollments.deletedCount} Enrollments.`);

  // 5. Clear attendance records & sessions
  const deletedAtt = await Attendance.deleteMany({});
  const deletedSessions = await AttendanceSession.deleteMany({});
  const deletedLogs = await mongoose.connection.db.collection('attendancelogs').deleteMany({});
  console.log(`Cleared ${deletedAtt.deletedCount} Attendance records, ${deletedSessions.deletedCount} Sessions, ${deletedLogs.deletedCount} Logs.`);

  // 6. Clear scores & placement data
  const deletedScores = await Score.deleteMany({});
  const deletedPlacements = await Placement.deleteMany({});
  const deletedAssignments = await Assignment.deleteMany({});
  const deletedCertificates = await Certificate.deleteMany({});
  const deletedResets = await DeviceResetRequest.deleteMany({});
  const deletedNotifs = await Notification.deleteMany({});

  console.log(`Cleared scores, placements, assignments, certificates, reset requests, and notifications.`);

  // 7. Verify remaining trainer and admin credentials
  const remainingUsers = await User.find({}).select('name email role slaeId').lean();
  console.log('\n--- PRESERVED TRAINER & ADMIN CREDENTIALS ---');
  remainingUsers.forEach(u => {
    console.log(`- ${u.name} (${u.role}) | Email: ${u.email} | SLAE ID: ${u.slaeId || 'N/A'}`);
  });

  await mongoose.disconnect();
  console.log('\nDatabase cleanup complete!');
}

resetData().catch(err => {
  console.error('Reset failed:', err);
  mongoose.disconnect();
});
