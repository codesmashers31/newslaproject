import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Student from '../models/Student.js';

const realStudentsData = [
  // Image 1 (59 records)
  { eid: 'EID_26_006962', name: 'Gokul' },
  { eid: 'EID_26_006768', name: 'Arun.S' },
  { eid: 'EID_26_006730', name: 'D.DHINESH KUMAR' },
  { eid: 'EID_26_006776', name: 'AKASH S' },
  { eid: 'EID_26_006845', name: 'R.Janani' },
  { eid: 'EID_26_006777', name: 'ANBU A' },
  { eid: 'EID_26_006780', name: 'Pukazhenthi.A' },
  { eid: 'EID_26_006898', name: 'Suvalakshmi v' },
  { eid: 'EID_26_006879', name: 'Jayanth E S' },
  { eid: 'EID_26_006779', name: 'Vishwa' },
  { eid: 'EID_26_006725', name: 'Heman Raj S' },
  { eid: 'EID_26_006818', name: 'Arun Sabharish M' },
  { eid: 'EID_26_006892', name: 'Vinothkumar R' },
  { eid: 'EID_26_006731', name: 'Mohan S' },
  { eid: 'EID_26_006734', name: 'Chethan' },
  { eid: 'EID_26_006647', name: 'Gayathri G' },
  { eid: 'EID_26_006795', name: 'rithika' },
  { eid: 'EID_26_006844', name: 'Rajitha K' },
  { eid: 'EID_26_006868', name: 'Thanuja R' },
  { eid: 'EID_26_006767', name: 'SYED NISAR AHAMED .S' },
  { eid: 'EID_26_006848', name: 'Vishnu Ravichandran' },
  { eid: 'EID_26_006192', name: 'Mathan M D' },
  { eid: 'EID_26_006753', name: 'S.Sonia' },
  { eid: 'EID_26_006787', name: 'Sanjay M' },
  { eid: 'EID_26_006666', name: 'Tejeswari J' },
  { eid: 'EID_26_006815', name: 'Tabasiya A' },
  { eid: 'EID_26_006789', name: 'Ashvi R' },
  { eid: 'EID_26_006846', name: 'Gowtham Krishnan R' },
  { eid: 'EID_26_006714', name: 'Harish S' },
  { eid: 'EID_26_006692', name: 'Bhaarath M' },
  { eid: 'EID_26_006599', name: 'dhanasekar' },
  { eid: 'EID_26_006361', name: 'N.Vignesh' },
  { eid: 'EID_26_005863', name: 'R.K. Tharun' },
  { eid: 'EID_26_006820', name: 'Saswath S' },
  { eid: 'EID_26_006773', name: 'Renita Amala Rani J' },
  { eid: 'EID_26_006775', name: 'SURYA V' },
  { eid: 'EID_26_006801', name: 'Jeya Surya K' },
  { eid: 'EID_26_006605', name: 'Abiseik P' },
  { eid: 'EID_26_006339', name: 'SRIAKASH.S' },
  { eid: 'EID_26_006819', name: 'Dhanalakshmi A' },
  { eid: 'EID_26_006772', name: 'JANARTHANAN R' },
  { eid: 'EID_26_006724', name: 'Dhanaseelan.M' },
  { eid: 'EID_26_006525', name: 'Dhayapradeep B' },
  { eid: 'EID_26_006417', name: 'Naveen. P' },
  { eid: 'EID_26_005870', name: 'Dhanush' },
  { eid: 'EID_26_006796', name: 'A.Anbupriya' },
  { eid: 'EID_26_006602', name: 'A.Sathya' },
  { eid: 'EID_26_006486', name: 'R. Bhuvaneswaran' },
  { eid: 'EID_26_006359', name: 'Bharathi M' },
  { eid: 'EID_26_006814', name: 'Praveen G' },
  { eid: 'EID_26_006802', name: 'S.NAVEEN' },
  { eid: 'EID_26_006766', name: 'Santhosh kumar S' },
  { eid: 'EID_26_006740', name: 'Abdulmajid K' },
  { eid: 'EID_26_006622', name: 'GOPINATH JM' },
  { eid: 'EID_26_006360', name: 'Thamizhselvan S' },
  { eid: 'EID_26_006810', name: 'Vishal' },
  { eid: 'EID_26_006757', name: 'Monica K' },
  { eid: 'EID_26_006424', name: 'Akash Y' },
  { eid: 'EID_26_006154', name: 'Janani' },

  // Image 2 (26 records)
  { eid: 'EID_26_005586', name: 'Nandha' },
  { eid: 'EID_26_007101', name: 'QUINCY MEDONA V' },
  { eid: 'EID_26_007100', name: 'Arockia Jenifer P' },
  { eid: 'EID_26_007319', name: 'Prakash' },
  { eid: 'EID_26_007388', name: 'Sarjith' },
  { eid: 'EID_24_002702', name: 'Kavin prabhu S' },
  { eid: 'EID_26_007349', name: 'singaravelan c' },
  { eid: 'EID_26_006392', name: 'Riswana Barvin B' },
  { eid: 'EID_26_006658', name: 'Abinaya R' },
  { eid: 'EID_26_007350', name: 'Pugazhmani m' },
  { eid: 'EID_26_006578', name: 'Nivedhitha KR' },
  { eid: 'EID_26_007266', name: 'Arokia Romero Princy P' },
  { eid: 'EID_26_007265', name: 'DHINESH KUMAR R' },
  { eid: 'EID_26_007178', name: 'P. Senthil Kumaran' },
  { eid: 'EID_26_007177', name: 'S.PURUSOTHAMAN' },
  { eid: 'EID_26_007176', name: 'S. Vijaya Kumar' },
  { eid: 'EID_26_007175', name: 'S.MAYA KRISHNAN' },
  { eid: 'EID_26_007200', name: 'S.SATHYA' },
  { eid: 'EID_26_007149', name: 'T. Catherine' },
  { eid: 'EID_26_007124', name: 'D Nathiya' },
  { eid: 'EID_26_006896', name: 'Riyas' },
  { eid: 'EID_26_005642', name: 'NaveenKumar' },
  { eid: 'EID_26_007099', name: 'G.Manooj' },
  { eid: 'EID_26_006981', name: 'Deepak D' },
  { eid: 'EID_26_006942', name: 'SAMUVEL SHERBIN.P' },
  { eid: 'EID_26_006857', name: 'Maheshwaran s' }
];

const seedRealStudents = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not set');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    console.log(`🌱 Seeding ${realStudentsData.length} Real Students without allocated courses...`);

    let createdCount = 0;
    for (const item of realStudentsData) {
      const email = `${item.eid.toLowerCase()}@slainstitute.com`;
      const mobileNum = `9840${Math.floor(100050 + Math.random() * 899900)}`;

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: item.name,
          email,
          mobile: mobileNum,
          password: 'student123',
          role: 'Student',
          isApproved: true
        });
      }

      let student = await Student.findOne({ user: user._id });
      if (!student) {
        await Student.create({
          user: user._id,
          studentId: item.eid,
          collegeName: 'SLA Institute',
          status: 'Active'
        });
      }
      createdCount++;
    }

    console.log(`✅ Successfully seeded ${createdCount} real SLA students!`);
    console.log('💡 Note: All students are created without course allocations. Attendance tracking will begin once each student selects/allocates their courses!');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedRealStudents();
