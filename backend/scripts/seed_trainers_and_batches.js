import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Batch from '../models/Batch.js';

const trainersToSeed = [
  {
    name: 'Balamugunthan S',
    email: 'slatrainer2@gmail.com',
    mobile: '9840123456',
    password: 'trainer123',
    role: 'Technical Trainer',
    department: 'Technical'
  },
  {
    name: 'Mari Priyan',
    email: 'maripriyan@slainstitute.com',
    mobile: '9840234567',
    password: 'trainer123',
    role: 'Aptitude Trainer',
    department: 'Aptitude'
  },
  {
    name: 'Maariya',
    email: 'maariya@slainstitute.com',
    mobile: '9840345678',
    password: 'trainer123',
    role: 'Communication Trainer',
    department: 'Communication'
  }
];

const seedTrainersAndBatches = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not set');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    console.log('1. Seeding 3 Trainers...');
    const trainerUserMap = new Map();

    for (const tr of trainersToSeed) {
      let user = await User.findOne({ email: tr.email });
      if (!user) {
        user = await User.create({
          name: tr.name,
          email: tr.email,
          mobile: tr.mobile,
          password: tr.password,
          role: 'Trainer',
          isApproved: true
        });
        console.log(`  + Created Trainer: ${tr.name} (${tr.email})`);
      } else {
        user.name = tr.name;
        user.password = tr.password; // Hook will hash
        await user.save();
        console.log(`  ~ Updated Trainer: ${tr.name} (${tr.email})`);
      }
      trainerUserMap.set(tr.department, user._id);
    }

    const techTrainerId = trainerUserMap.get('Technical');
    const aptiTrainerId = trainerUserMap.get('Aptitude');
    const commTrainerId = trainerUserMap.get('Communication');

    console.log('\n2. Seeding Batches...');

    // A. Technical Batches (Balamugunthan S)
    const techBatches = [
      {
        batchId: 'SLAKKN_FE_200826',
        name: 'Frontend-Batch 12-02',
        course: 'Frontend Development',
        department: 'Technical',
        startDate: new Date('2026-08-20'),
        endDate: new Date('2026-11-13'),
        startTime: '12:00 PM',
        endTime: '02:00 PM',
        schedule: 'Mon - Fri • 12:00 PM – 02:00 PM',
        trainers: [techTrainerId],
        technicalTrainer: techTrainerId
      },
      {
        batchId: 'SLAKKN_FE_060726',
        name: 'Frontend-Batch 8-10',
        course: 'Frontend Development',
        department: 'Technical',
        startDate: new Date('2026-07-06'),
        endDate: new Date('2026-09-30'),
        startTime: '08:00 AM',
        endTime: '10:00 AM',
        schedule: 'Mon - Fri • 08:00 AM – 10:00 AM',
        trainers: [techTrainerId],
        technicalTrainer: techTrainerId
      }
    ];

    // B. Aptitude Batches (6 Batches - Mari Priyan)
    const aptiTimes = [
      { start: '10:00 AM', end: '11:00 AM', num: 1 },
      { start: '11:00 AM', end: '12:00 PM', num: 2 },
      { start: '12:00 PM', end: '01:00 PM', num: 3 },
      { start: '02:00 PM', end: '03:00 PM', num: 4 },
      { start: '03:00 PM', end: '04:00 PM', num: 5 },
      { start: '04:00 PM', end: '05:00 PM', num: 6 }
    ];

    const aptiBatches = aptiTimes.map(t => ({
      batchId: `SLAKKN_APTI_B${t.num}`,
      name: `Aptitude Batch ${t.num} (${t.start}-${t.end})`,
      course: 'Aptitude & Reasoning',
      department: 'Aptitude',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-12-31'),
      startTime: t.start,
      endTime: t.end,
      schedule: `Mon - Fri • ${t.start} – ${t.end}`,
      trainers: [aptiTrainerId],
      aptitudeTrainer: aptiTrainerId
    }));

    // C. Communication Batches (6 Batches - Maariya)
    const commTimes = [
      { start: '10:00 AM', end: '11:00 AM', num: 1 },
      { start: '11:00 AM', end: '12:00 PM', num: 2 },
      { start: '12:00 PM', end: '01:00 PM', num: 3 },
      { start: '01:00 PM', end: '02:00 PM', num: 4 },
      { start: '03:00 PM', end: '04:00 PM', num: 5 },
      { start: '04:00 PM', end: '05:00 PM', num: 6 }
    ];

    const commBatches = commTimes.map(t => ({
      batchId: `SLAKKN_COMM_B${t.num}`,
      name: `Communication Batch ${t.num} (${t.start}-${t.end})`,
      course: 'Communication Skills',
      department: 'Communication',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-11-30'),
      startTime: t.start,
      endTime: t.end,
      schedule: `Mon - Fri • ${t.start} – ${t.end}`,
      trainers: [commTrainerId],
      communicationTrainer: commTrainerId
    }));

    const allBatchesToSeed = [...techBatches, ...aptiBatches, ...commBatches];

    for (const bData of allBatchesToSeed) {
      let b = await Batch.findOne({ batchId: bData.batchId });
      if (!b) {
        await Batch.create(bData);
        console.log(`  + Created Batch: ${bData.name} [${bData.batchId}]`);
      } else {
        Object.assign(b, bData);
        await b.save();
        console.log(`  ~ Updated Batch: ${bData.name} [${bData.batchId}]`);
      }
    }

    console.log('\n🎉 Successfully seeded 3 Trainers and 14 Batches!');
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedTrainersAndBatches();
