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

// Simulate getAssignedStudents logic directly
async function testDateFiltering() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected...');

  const student = await User.findOne({ name: /Meena/i });
  const allBatches = await Batch.find().populate('students').lean();
  const enrollments = await Enrollment.find().lean();

  const testDates = ['2026-08-12', '2026-08-14', '2026-08-17'];

  for (const dateStr of testDates) {
    const selectedDateParam = new Date(dateStr);
    selectedDateParam.setHours(0, 0, 0, 0);

    const studentMap = {};
    const allStudentUsers = [student];

    for (const std of allStudentUsers) {
      const studentEnrolls = enrollments.filter(e => e.studentId.toString() === std._id.toString());
      if (selectedDateParam && studentEnrolls.length > 0) {
        const isEnrolledOnDate = studentEnrolls.some(e => {
          const start = new Date(e.startDate || e.createdAt);
          start.setHours(0, 0, 0, 0);
          const end = e.completedAt ? new Date(e.completedAt) : (e.endDate ? new Date(e.endDate) : null);
          if (end) end.setHours(23, 59, 59, 999);
          return selectedDateParam >= start && (!end || selectedDateParam <= end);
        });

        if (!isEnrolledOnDate) continue;
      }
      studentMap[std._id] = std.name;
    }

    for (const batch of allBatches) {
      for (const std of batch.students || []) {
        const stdId = std._id || std;
        if (String(stdId) !== String(student._id)) continue;

        const studentEnrolls = enrollments.filter(e => e.studentId.toString() === stdId.toString());
        if (selectedDateParam && studentEnrolls.length > 0) {
          const isEnrolledOnDate = studentEnrolls.some(e => {
            const start = new Date(e.startDate || e.createdAt);
            start.setHours(0, 0, 0, 0);
            const end = e.completedAt ? new Date(e.completedAt) : (e.endDate ? new Date(e.endDate) : null);
            if (end) end.setHours(23, 59, 59, 999);
            return selectedDateParam >= start && (!end || selectedDateParam <= end);
          });

          if (!isEnrolledOnDate) continue;
        }

        if (!studentMap[stdId]) {
          studentMap[stdId] = std.name;
        }
      }
    }

    const isMeenaVisible = Boolean(studentMap[student._id]);
    console.log(`[Date: ${dateStr}] Meena R Visible in Roster: ${isMeenaVisible ? 'YES (SHOWN)' : 'NO (HIDDEN)'}`);
  }

  await mongoose.disconnect();
}

testDateFiltering().catch(console.error);
