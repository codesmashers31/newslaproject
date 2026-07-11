import Batch from '../models/Batch.js';
import User from '../models/User.js';

/**
 * Automatically resolves and updates a student's domain batches and trainers
 * based on the active batches they are enrolled in.
 */
export const syncStudentTrainers = async (studentId) => {
  try {
    const batches = await Batch.find({ students: studentId })
      .populate('trainers', 'name role')
      .lean();

    const techBatches = [];
    const techTrainers = [];
    const commBatches = [];
    const commTrainers = [];
    const aptiBatches = [];
    const aptiTrainers = [];

    for (const batch of batches) {
      const courseType = batch.course || '';
      const isTech = courseType === 'Technical Training' || (!courseType.includes('Communication') && !courseType.includes('Aptitude'));
      const isComm = courseType.includes('Communication');
      const isApti = courseType.includes('Aptitude');

      if (isTech) {
        if (!techBatches.includes(batch.name)) techBatches.push(batch.name);
        let trainer = batch.trainers?.find(t => t.role === 'Technical Trainer');
        if (!trainer && batch.trainers?.length > 0) trainer = batch.trainers[0];
        if (trainer && !techTrainers.includes(trainer.name)) techTrainers.push(trainer.name);
      }
      if (isComm) {
        if (!commBatches.includes(batch.name)) commBatches.push(batch.name);
        let trainer = batch.trainers?.find(t => t.role === 'Communication Trainer');
        if (!trainer && batch.trainers?.length > 0) trainer = batch.trainers[0];
        if (trainer && !commTrainers.includes(trainer.name)) commTrainers.push(trainer.name);
      }
      if (isApti) {
        if (!aptiBatches.includes(batch.name)) aptiBatches.push(batch.name);
        let trainer = batch.trainers?.find(t => t.role === 'Aptitude Trainer');
        if (!trainer && batch.trainers?.length > 0) trainer = batch.trainers[0];
        if (trainer && !aptiTrainers.includes(trainer.name)) aptiTrainers.push(trainer.name);
      }
    }

    const updateFields = {
      technicalBatch: techBatches.join(', '),
      technicalTrainer: techTrainers.join(', '),
      communicationBatch: commBatches.join(', '),
      communicationTrainer: commTrainers.join(', '),
      aptitudeBatch: aptiBatches.join(', '),
      aptitudeTrainer: aptiTrainers.join(', ')
    };

    // Always update student fields, even if some have become empty (e.g. unassigned from batches)
    await User.findByIdAndUpdate(studentId, { $set: updateFields });
    console.log(`Synced trainers for student ${studentId}:`, updateFields);
  } catch (error) {
    console.error(`Failed to sync trainers for student ${studentId}:`, error);
  }
};

/**
 * Syncs trainer fields for all students assigned to a specific batch.
 * Useful when trainers are updated on a batch.
 */
export const syncBatchStudents = async (batchId) => {
  try {
    const batch = await Batch.findById(batchId).lean();
    if (!batch || !batch.students) return;
    for (const studentId of batch.students) {
      await syncStudentTrainers(studentId);
    }
  } catch (error) {
    console.error(`Failed to sync batch students for batch ${batchId}:`, error);
  }
};

/**
 * Synchronizes a student's database batch enrollments (Batch.students array)
 * based on the comma-separated strings of batch names in their user document,
 * then resolves the trainers.
 */
export const syncStudentBatchesFromStrings = async (studentId) => {
  try {
    const student = await User.findById(studentId).lean();
    if (!student) return;

    const batchNames = [];
    if (student.technicalBatch) {
      student.technicalBatch.split(',').forEach(b => {
        const name = b.trim();
        if (name) batchNames.push(name);
      });
    }
    if (student.communicationBatch) {
      student.communicationBatch.split(',').forEach(b => {
        const name = b.trim();
        if (name) batchNames.push(name);
      });
    }
    if (student.aptitudeBatch) {
      student.aptitudeBatch.split(',').forEach(b => {
        const name = b.trim();
        if (name) batchNames.push(name);
      });
    }

    // 1. Add student to all matching batches
    if (batchNames.length > 0) {
      await Batch.updateMany(
        { name: { $in: batchNames } },
        { $addToSet: { students: studentId } }
      );
    }

    // 2. Remove student from all non-matching batches
    await Batch.updateMany(
      { name: { $nin: batchNames } },
      { $pull: { students: studentId } }
    );

    // 3. Resolve and update trainer names
    await syncStudentTrainers(studentId);
  } catch (error) {
    console.error(`Failed to sync student batches from strings for student ${studentId}:`, error);
  }
};
