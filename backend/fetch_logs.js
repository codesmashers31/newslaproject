import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const AttendanceLog = mongoose.model('AttendanceLog', new mongoose.Schema({}, { strict: false, collection: 'attendancelogs' }));
    const logs = await AttendanceLog.find({ status: 'Failed' }).sort({ createdAt: -1 }).limit(10);
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
