
import mongoose from 'mongoose';
import 'dotenv/config';

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://mockeefy_db_user:y5Ztd0V5fDCPgt98@ac-ps9kzkg-shard-00-00.w4nf7cn.mongodb.net:27017,ac-ps9kzkg-shard-00-01.w4nf7cn.mongodb.net:27017,ac-ps9kzkg-shard-00-02.w4nf7cn.mongodb.net:27017/sladb?ssl=true&replicaSet=atlas-10dev4-shard-0&authSource=admin&appName=Cluster0');
    console.log('Connected. Creating indexes...');

    const db = mongoose.connection.db;

    const indexes = [
      { col: 'users', key: { slaeId: 1 } },
      { col: 'users', key: { role: 1 } },
      { col: 'users', key: { status: 1 } },
      { col: 'students', key: { mobile: 1 } },
      { col: 'batches', key: { trainers: 1 } },
      { col: 'batches', key: { students: 1 } },
      { col: 'batches', key: { course: 1 } },
      { col: 'batches', key: { status: 1 } },
      { col: 'enrollments', key: { studentId: 1 } },
      { col: 'enrollments', key: { batchId: 1 } },
      { col: 'enrollments', key: { trainerId: 1 } },
      { col: 'enrollments', key: { status: 1 } },
      { col: 'attendances', key: { student: 1 } },
      { col: 'attendances', key: { batch: 1 } },
      { col: 'attendances', key: { date: -1 } },
      { col: 'scores', key: { student: 1 } },
      { col: 'scores', key: { batch: 1 } },
      { col: 'scores', key: { category: 1 } },
      { col: 'scores', key: { moduleName: 1 } },
      { col: 'placements', key: { student: 1 } },
      { col: 'notifications', key: { recipient: 1 } },
      { col: 'notifications', key: { createdAt: -1 } },
      { col: 'certificates', key: { student: 1 } }
    ];

    for (const { col, key } of indexes) {
      try {
        await db.collection(col).createIndex(key, { background: true });
        console.log('Created index on', col, key);
      } catch (err) {
        if (err.code === 86 || err.code === 85) {
          console.log('Index already exists on', col, key);
        } else {
          console.error('Error creating index on', col, key, err.message);
        }
      }
    }

    console.log('Successfully created all indexes for faster queries.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createIndexes();

