import Batch from '../models/Batch.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

/**
 * Automatically resolves and updates a student's domain enrollments
 * based on the active batches they are enrolled in.
 */
export const syncStudentTrainers = async (studentId) => {
  try {
    const batches = await Batch.find({ students: studentId })
      .populate('trainers', 'name role')
      .lean();

    const activeBatchIds = batches.map(b => b._id.toString());

    // 1. Mark any active enrollments that are no longer in the batches list as Completed
    const oldActiveEnrollments = await Enrollment.find({ studentId, status: 'Active' });
    for (const enroll of oldActiveEnrollments) {
      if (!activeBatchIds.includes(enroll.batchId.toString())) {
        enroll.status = 'Completed';
        enroll.completedAt = new Date();
        await enroll.save();
      }
    }

    // 2. Create or update active enrollments for each batch
    for (const batch of batches) {
      const courseType = batch.course || '';
      let dept = 'Technical';
      if (courseType.includes('Communication')) {
        dept = 'Communication';
      } else if (courseType.includes('Aptitude')) {
        dept = 'Aptitude';
      }

      let trainer = batch.trainers?.find(t => t.role === `${dept} Trainer`);
      if (!trainer && batch.trainers?.length > 0) {
        trainer = batch.trainers[0];
      }

      await Enrollment.findOneAndUpdate(
        { studentId, batchId: batch._id, department: dept },
        {
          trainerId: trainer ? trainer._id : null,
          course: batch.course,
          status: 'Active',
          enrolledAt: new Date()
        },
        { upsert: true, new: true }
      );
    }
    console.log(`Synced enrollments for student ${studentId} based on active batches.`);
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
 * based on the comma-separated strings of batch names, then resolves the trainers.
 */
export const syncStudentBatchesFromStrings = async (studentId, batchStrings = {}) => {
  try {
    const student = await User.findById(studentId).lean();
    if (!student) return;

    // Use passed strings, fallback to user document legacy fields for migration compatibility
    const techStr = batchStrings.technicalBatch !== undefined ? batchStrings.technicalBatch : (student.technicalBatch || '');
    const commStr = batchStrings.communicationBatch !== undefined ? batchStrings.communicationBatch : (student.communicationBatch || '');
    const aptiStr = batchStrings.aptitudeBatch !== undefined ? batchStrings.aptitudeBatch : (student.aptitudeBatch || '');

    const batchNames = [];
    if (techStr) {
      techStr.split(',').forEach(b => {
        const name = b.trim();
        if (name) batchNames.push(name);
      });
    }
    if (commStr) {
      commStr.split(',').forEach(b => {
        const name = b.trim();
        if (name) batchNames.push(name);
      });
    }
    if (aptiStr) {
      aptiStr.split(',').forEach(b => {
        const name = b.trim();
        if (name) batchNames.push(name);
      });
    }

    // 1. Ensure all batches in batchNames exist in the database, if not auto-create them
    for (const name of batchNames) {
      const exists = await Batch.findOne({ name });
      if (!exists) {
        let course = 'Technical Training';
        if (commStr.split(',').map(s => s.trim()).includes(name)) {
          course = 'Communication Skills';
        } else if (aptiStr.split(',').map(s => s.trim()).includes(name)) {
          course = 'Aptitude & Reasoning';
        }
        
        await Batch.create({
          name,
          batchId: name.toUpperCase().replace(/\s+/g, ''),
          course,
          students: [studentId],
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
        });
        console.log(`Auto-created missing batch: ${name} for course: ${course}`);
      }
    }

    // 2. Add student to all matching batches
    if (batchNames.length > 0) {
      await Batch.updateMany(
        { name: { $in: batchNames } },
        { $addToSet: { students: studentId } }
      );
    }

    // 3. Remove student from all non-matching batches
    await Batch.updateMany(
      { name: { $nin: batchNames } },
      { $pull: { students: studentId } }
    );

    // 4. Resolve and update trainer names inside the Enrollment collection
    await syncStudentTrainers(studentId);
  } catch (error) {
    console.error(`Failed to sync student batches from strings for student ${studentId}:`, error);
  }
};
