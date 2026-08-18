import mongoose from 'mongoose';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import path from 'path';
dotenv.config();

import User from '../models/User.js';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';
import Placement from '../models/Placement.js';

const downloadsPath1 = 'C:/Users/Janani/Downloads/Enrollment Batch Details for Trainers.xlsx';
const downloadsPath2 = 'C:/Users/Janani/Downloads/Enrollment Batch Details for Trainers (1).xlsx';

const importStudentsFromDownloads = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not set');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    console.log('1. Parsing Excel sheets from Downloads...');
    const allStudentsMap = new Map();

    [downloadsPath1, downloadsPath2].forEach(filePath => {
      try {
        const wb = xlsx.readFile(filePath);
        wb.SheetNames.forEach(sheetName => {
          const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
          rows.forEach(r => {
            const eid = r['Enrollments'] || r['EID'] || r['SLAEID'];
            const name = r['Student Name'] || r['Name'];
            if (eid && name) {
              const cleanEid = String(eid).trim();
              const cleanName = String(name).trim();
              if (!allStudentsMap.has(cleanEid)) {
                allStudentsMap.set(cleanEid, cleanName);
              }
            }
          });
        });
      } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
      }
    });

    console.log(`📊 Total unique students extracted from Excel files: ${allStudentsMap.size}`);

    console.log('2. Wiping existing student accounts & student data...');
    await Promise.all([
      Student.deleteMany({}),
      Enrollment.deleteMany({}),
      Attendance.deleteMany({}),
      Score.deleteMany({}),
      Placement.deleteMany({}),
      User.deleteMany({ role: 'Student' })
    ]);
    console.log('✅ Cleared all student records and user accounts!');

    console.log('3. Re-importing students with clean unassigned courses...');
    let importedCount = 0;
    for (const [eid, name] of allStudentsMap.entries()) {
      const email = `${eid.toLowerCase()}@slainstitute.com`;
      const mobile = `9840${Math.floor(100050 + Math.random() * 899900)}`;

      const user = await User.create({
        name,
        email,
        mobile,
        slaeId: eid,
        password: eid,
        role: 'Student',
        isApproved: true
      });

      await Student.create({
        user: user._id,
        studentId: eid,
        collegeName: 'SLA Institute',
        status: 'Active'
      });

      importedCount++;
    }

    console.log(`🎉 Successfully imported ${importedCount} real students from Excel downloads!`);
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Excel Import Failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

importStudentsFromDownloads();
