import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Batch from './models/Batch.js';
import Enrollment from './models/Enrollment.js';

dotenv.config();

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('MongoDB Connected for migration.');

    const students = await User.find({ role: 'Student' });
    console.log(`Found ${students.length} students to migrate.`);

    let techCount = 0;
    let commCount = 0;
    let aptiCount = 0;
    let errorsCount = 0;

    for (const student of students) {
      // 1. Process Technical Batches
      if (student.technicalBatch) {
        const batchNames = student.technicalBatch.split(',').map(s => s.trim()).filter(Boolean);
        const trainerNames = student.technicalTrainer ? student.technicalTrainer.split(',').map(s => s.trim()).filter(Boolean) : [];

        for (let i = 0; i < batchNames.length; i++) {
          const bName = batchNames[i];
          const tName = trainerNames[i] || trainerNames[0]; // fallback to first tech trainer

          try {
            // Find or create batch
            let batch = await Batch.findOne({ name: bName });
            if (!batch) {
              batch = await Batch.create({
                name: bName,
                batchId: bName.toUpperCase().replace(/\s+/g, ''),
                course: 'Technical Training',
                status: 'Active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              });
            }

            // Find trainer
            let trainer = null;
            if (tName) {
              trainer = await User.findOne({ name: tName, role: 'Technical Trainer' });
            }
            if (!trainer && batch.trainers?.length > 0) {
              trainer = await User.findById(batch.trainers[0]);
            }

            // Create enrollment
            await Enrollment.findOneAndUpdate(
              { studentId: student._id, batchId: batch._id, department: 'Technical' },
              {
                trainerId: trainer ? trainer._id : null,
                course: batch.course,
                status: 'Active',
                enrolledAt: new Date()
              },
              { upsert: true, new: true }
            );

            // Add student to batch if not already present
            if (!batch.students?.includes(student._id)) {
              await Batch.findByIdAndUpdate(batch._id, { $addToSet: { students: student._id } });
            }

            techCount++;
          } catch (err) {
            console.error(`Error migrating technical batch "${bName}" for student ${student.name}:`, err.message);
            errorsCount++;
          }
        }
      }

      // 2. Process Communication Batches
      if (student.communicationBatch) {
        const batchNames = student.communicationBatch.split(',').map(s => s.trim()).filter(Boolean);
        const trainerNames = student.communicationTrainer ? student.communicationTrainer.split(',').map(s => s.trim()).filter(Boolean) : [];

        for (let i = 0; i < batchNames.length; i++) {
          const bName = batchNames[i];
          const tName = trainerNames[i] || trainerNames[0];

          try {
            let batch = await Batch.findOne({ name: bName });
            if (!batch) {
              batch = await Batch.create({
                name: bName,
                batchId: bName.toUpperCase().replace(/\s+/g, ''),
                course: 'Communication Skills',
                status: 'Active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              });
            }

            let trainer = null;
            if (tName) {
              trainer = await User.findOne({ name: tName, role: 'Communication Trainer' });
            }
            if (!trainer && batch.trainers?.length > 0) {
              trainer = await User.findById(batch.trainers[0]);
            }

            await Enrollment.findOneAndUpdate(
              { studentId: student._id, batchId: batch._id, department: 'Communication' },
              {
                trainerId: trainer ? trainer._id : null,
                course: batch.course,
                status: 'Active',
                enrolledAt: new Date()
              },
              { upsert: true, new: true }
            );

            if (!batch.students?.includes(student._id)) {
              await Batch.findByIdAndUpdate(batch._id, { $addToSet: { students: student._id } });
            }

            commCount++;
          } catch (err) {
            console.error(`Error migrating communication batch "${bName}" for student ${student.name}:`, err.message);
            errorsCount++;
          }
        }
      }

      // 3. Process Aptitude Batches
      if (student.aptitudeBatch) {
        const batchNames = student.aptitudeBatch.split(',').map(s => s.trim()).filter(Boolean);
        const trainerNames = student.aptitudeTrainer ? student.aptitudeTrainer.split(',').map(s => s.trim()).filter(Boolean) : [];

        for (let i = 0; i < batchNames.length; i++) {
          const bName = batchNames[i];
          const tName = trainerNames[i] || trainerNames[0];

          try {
            let batch = await Batch.findOne({ name: bName });
            if (!batch) {
              batch = await Batch.create({
                name: bName,
                batchId: bName.toUpperCase().replace(/\s+/g, ''),
                course: 'Aptitude & Reasoning',
                status: 'Active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              });
            }

            let trainer = null;
            if (tName) {
              trainer = await User.findOne({ name: tName, role: 'Aptitude Trainer' });
            }
            if (!trainer && batch.trainers?.length > 0) {
              trainer = await User.findById(batch.trainers[0]);
            }

            await Enrollment.findOneAndUpdate(
              { studentId: student._id, batchId: batch._id, department: 'Aptitude' },
              {
                trainerId: trainer ? trainer._id : null,
                course: batch.course,
                status: 'Active',
                enrolledAt: new Date()
              },
              { upsert: true, new: true }
            );

            if (!batch.students?.includes(student._id)) {
              await Batch.findByIdAndUpdate(batch._id, { $addToSet: { students: student._id } });
            }

            aptiCount++;
          } catch (err) {
            console.error(`Error migrating aptitude batch "${bName}" for student ${student.name}:`, err.message);
            errorsCount++;
          }
        }
      }
    }

    console.log('\nMIGRATION COMPLETED SUCCESSFULLY!');
    console.log(`- Technical Enrollments Created: ${techCount}`);
    console.log(`- Communication Enrollments Created: ${commCount}`);
    console.log(`- Aptitude Enrollments Created: ${aptiCount}`);
    console.log(`- Errors Encountered: ${errorsCount}`);

    mongoose.disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
