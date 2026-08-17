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

      const existing = await Enrollment.findOne({ studentId, batchId: batch._id, department: dept });
      const studentUser = await User.findById(studentId).lean();
      const defaultStart = studentUser?.createdAt || new Date();

      if (!existing) {
        await Enrollment.create({
          studentId,
          batchId: batch._id,
          department: dept,
          trainerId: trainer ? trainer._id : null,
          course: batch.course,
          status: 'Active',
          enrolledAt: new Date(),
          startDate: defaultStart
        });
      } else {
        existing.trainerId = trainer ? trainer._id : null;
        existing.course = batch.course;
        existing.status = 'Active';
        if (!existing.startDate) {
          existing.startDate = defaultStart;
        }
        await existing.save();
      }
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

/**
 * Ultra-fast bulk synchronization of batch enrollments for multiple students at once using bulkWrite
 * @param {Array<{studentId: ObjectId|string, batches: {technicalBatch: string, communicationBatch: string, aptitudeBatch: string}}>} items
 */
export const bulkSyncStudentBatches = async (items) => {
  if (!items || items.length === 0) return;

  try {
    // 1. Pre-fetch all batches and users
    const allBatches = await Batch.find().lean();
    const batchMap = new Map();
    allBatches.forEach(b => {
      batchMap.set(b.name.trim().toLowerCase(), b);
      if (b.batchId) batchMap.set(b.batchId.trim().toLowerCase(), b);
    });

    const studentIds = items.map(i => i.studentId);
    const users = await User.find({ _id: { $in: studentIds } }).lean();
    const userMap = new Map();
    users.forEach(u => userMap.set(u._id.toString(), u));

    // 2. Identify missing batches and create them in bulk
    const missingBatchesToCreate = [];
    const createdBatchNames = new Set();

    for (const item of items) {
      const { technicalBatch, communicationBatch, aptitudeBatch } = item.batches;
      const names = [
        { name: technicalBatch, course: 'Technical Training' },
        { name: communicationBatch, course: 'Communication Skills' },
        { name: aptitudeBatch, course: 'Aptitude & Reasoning' }
      ];

      for (const n of names) {
        if (!n.name) continue;
        const cleanName = n.name.trim();
        const lowerName = cleanName.toLowerCase();
        if (!batchMap.has(lowerName) && !createdBatchNames.has(lowerName)) {
          createdBatchNames.add(lowerName);
          missingBatchesToCreate.push({
            name: cleanName,
            batchId: cleanName.toUpperCase().replace(/\s+/g, ''),
            course: n.course,
            students: [],
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          });
        }
      }
    }

    if (missingBatchesToCreate.length > 0) {
      const created = await Batch.insertMany(missingBatchesToCreate, { ordered: false });
      created.forEach(b => {
        batchMap.set(b.name.trim().toLowerCase(), b);
        if (b.batchId) batchMap.set(b.batchId.trim().toLowerCase(), b);
      });
    }

    // 3. Build bulkWrite operations for Batch student arrays
    const batchStudentAddMap = new Map(); // batchId -> Set of studentIds

    items.forEach(item => {
      const sId = item.studentId.toString();
      const { technicalBatch, communicationBatch, aptitudeBatch } = item.batches;
      const bNames = [technicalBatch, communicationBatch, aptitudeBatch].filter(Boolean).map(s => s.trim().toLowerCase());

      bNames.forEach(bName => {
        const b = batchMap.get(bName);
        if (b) {
          const bId = b._id.toString();
          if (!batchStudentAddMap.has(bId)) {
            batchStudentAddMap.set(bId, new Set());
          }
          batchStudentAddMap.get(bId).add(sId);
        }
      });
    });

    const batchBulkOps = [];
    batchStudentAddMap.forEach((sIdSet, bId) => {
      batchBulkOps.push({
        updateOne: {
          filter: { _id: bId },
          update: { $addToSet: { students: { $each: Array.from(sIdSet) } } }
        }
      });
    });

    if (batchBulkOps.length > 0) {
      await Batch.bulkWrite(batchBulkOps, { ordered: false });
    }

    // 4. Pre-fetch existing Enrollments for all students
    const existingEnrollments = await Enrollment.find({
      studentId: { $in: studentIds }
    }).lean();

    const enrollmentSet = new Set();
    existingEnrollments.forEach(e => {
      enrollmentSet.add(`${e.studentId.toString()}_${e.batchId.toString()}_${e.department}`);
    });

    const newEnrollmentsToCreate = [];

    items.forEach(item => {
      const sId = item.studentId.toString();
      const studentUser = userMap.get(sId);
      const defaultStart = studentUser?.createdAt || new Date();
      const { technicalBatch, communicationBatch, aptitudeBatch } = item.batches;

      const deptConfigs = [
        { name: technicalBatch, dept: 'Technical', course: 'Technical Training' },
        { name: communicationBatch, dept: 'Communication', course: 'Communication Skills' },
        { name: aptitudeBatch, dept: 'Aptitude', course: 'Aptitude & Reasoning' }
      ];

      deptConfigs.forEach(cfg => {
        if (!cfg.name) return;
        const b = batchMap.get(cfg.name.trim().toLowerCase());
        if (b) {
          const key = `${sId}_${b._id.toString()}_${cfg.dept}`;
          if (!enrollmentSet.has(key)) {
            enrollmentSet.add(key);
            newEnrollmentsToCreate.push({
              studentId: item.studentId,
              batchId: b._id,
              department: cfg.dept,
              course: b.course || cfg.course,
              status: 'Active',
              enrolledAt: new Date(),
              startDate: defaultStart
            });
          }
        }
      });
    });

    if (newEnrollmentsToCreate.length > 0) {
      await Enrollment.insertMany(newEnrollmentsToCreate, { ordered: false });
    }
  } catch (error) {
    console.error('Failed bulkSyncStudentBatches:', error);
  }
};
