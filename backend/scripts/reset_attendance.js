// Explicit one-time maintenance only. Never imported by the application.
// Default is a read-only preview. --apply requires an external recovery directory.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attendanceDayStart, attendanceDateKey } from '../utils/attendanceDate.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
const date = args.includes('--date') ? option('--date') : null;
const expectedDatabase = args.includes('--database') ? option('--database') : null;
const apply = args.includes('--apply');
const backupDirectory = args.includes('--backup-dir') ? path.resolve(option('--backup-dir')) : null;
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || attendanceDateKey(date) !== date || !expectedDatabase) {
  throw new Error('Specify --date YYYY-MM-DD and --database NAME. Add --apply --backup-dir PATH to execute.');
}
const projectDirectory = fileURLToPath(new URL('../../', import.meta.url));
const relativeBackup = backupDirectory ? path.relative(projectDirectory, backupDirectory) : '';
const backupInsideProject = relativeBackup === '' || (!path.isAbsolute(relativeBackup) && !relativeBackup.startsWith(`..${path.sep}`));
if (apply && (!backupDirectory || backupInsideProject)) {
  throw new Error('Recovery backup must be outside the project so student records cannot be committed to Git.');
}
const startDate = attendanceDayStart(date);
let session;
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lcp_management', {
    family: 4, serverSelectionTimeoutMS: 15000, autoIndex: false, autoCreate: false
  });
  const db = mongoose.connection.db;
  if (db.databaseName !== expectedDatabase) throw new Error('Connected database does not match --database. Nothing changed.');
  const collectionsBefore = (await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name).sort();
  const requiredCollections = ['users', 'enrollments', 'batches', 'attendances', 'attendancelogs', 'attendancesessions'];
  if (requiredCollections.some(name => !collectionsBefore.includes(name))) throw new Error('Required collection missing. Nothing changed.');
  const indexesBefore = {};
  for (const name of requiredCollections) indexesBefore[name] = await db.collection(name).listIndexes().toArray();

  session = await mongoose.startSession();
  session.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  const queryOptions = { session };
  const students = await db.collection('users').find({ role: 'Student' }, {
    ...queryOptions, projection: { _id: 1, attendanceStartDate: 1 }
  }).toArray();
  const studentIds = students.map(s => s._id);
  const enrollments = await db.collection('enrollments').find({ studentId: { $in: studentIds }, status: 'Active' }, {
    ...queryOptions, projection: { _id: 1, studentId: 1, batchId: 1, startDate: 1 }
  }).toArray();
  const batchIds = [...new Map(enrollments.map(e => [String(e.batchId), e.batchId])).values()];
  const batches = await db.collection('batches').find({ _id: { $in: batchIds } }, {
    ...queryOptions, projection: { _id: 1, startDate: 1 }
  }).toArray();
  const attendances = await db.collection('attendances').find({}, queryOptions).toArray();
  const attendanceLogs = await db.collection('attendancelogs').find({}, queryOptions).toArray();
  const activeSessions = await db.collection('attendancesessions').find({ isActive: true }, {
    ...queryOptions, projection: { _id: 1, isActive: 1 }
  }).toArray();
  const summary = { database: db.databaseName, date, students: students.length,
    activeEnrollments: enrollments.length, batches: batches.length,
    attendanceRecords: attendances.length, scanLogs: attendanceLogs.length,
    sessionsToClose: activeSessions.length };
  if (!apply) {
    await session.abortTransaction();
    console.log(JSON.stringify({ mode: 'preview', ...summary }, null, 2));
  } else {
    await fs.mkdir(backupDirectory, { recursive: true });
    const backupPath = path.join(backupDirectory, `attendance-reset-${date}-${Date.now()}.ejson`);
    await fs.writeFile(backupPath, mongoose.mongo.BSON.EJSON.stringify({
      summary, createdAt: new Date(), collectionsBefore, indexesBefore,
      students, enrollments, batches, attendances, attendanceLogs, activeSessions
    }, { relaxed: false }), { flag: 'wx', mode: 0o600 });

    // Delete the reviewed snapshot IDs only. New concurrent scans are not swept up.
    const removedAttendance = await db.collection('attendances').deleteMany({ _id: { $in: attendances.map(a => a._id) } }, queryOptions);
    // User-authorized reset of scan history; normal API log immutability remains intact.
    const removedLogs = await db.collection('attendancelogs').deleteMany({ _id: { $in: attendanceLogs.map(a => a._id) } }, queryOptions);
    await db.collection('users').updateMany({ _id: { $in: studentIds } }, { $set: { attendanceStartDate: startDate } }, queryOptions);
    await db.collection('enrollments').updateMany({ _id: { $in: enrollments.map(e => e._id) } }, { $set: { startDate } }, queryOptions);
    await db.collection('batches').updateMany({ _id: { $in: batchIds } }, { $set: { startDate } }, queryOptions);
    await db.collection('attendancesessions').updateMany({ _id: { $in: activeSessions.map(s => s._id) } }, { $set: { isActive: false } }, queryOptions);
    await session.commitTransaction();

    const collectionsAfter = (await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name).sort();
    if (JSON.stringify(collectionsAfter) !== JSON.stringify(collectionsBefore)) throw new Error('Reset committed, but collection inventory changed; inspect before any retry.');
    for (const name of requiredCollections) {
      const indexesAfter = await db.collection(name).listIndexes().toArray();
      if (JSON.stringify(indexesAfter) !== JSON.stringify(indexesBefore[name])) throw new Error('Reset committed, but index inventory changed; inspect before any retry.');
    }
    console.log(JSON.stringify({ mode: 'committed', ...summary, backupPath,
      removedAttendance: removedAttendance.deletedCount, removedScanLogs: removedLogs.deletedCount,
      remainingAttendance: await db.collection('attendances').countDocuments({}),
      remainingScanLogs: await db.collection('attendancelogs').countDocuments({}),
      collectionsAndIndexesPreserved: true }, null, 2));
  }
} finally {
  if (session?.inTransaction()) await session.abortTransaction();
  await session?.endSession();
  await mongoose.disconnect();
}
