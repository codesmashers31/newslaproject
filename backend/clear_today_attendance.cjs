const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Attendance = mongoose.connection.db.collection('attendances');
  const today = new Date();
  const startOfToday = new Date(today.setHours(0,0,0,0));
  const endOfToday = new Date(today.setHours(23,59,59,999));
  const res = await Attendance.deleteMany({ date: { $gte: startOfToday, $lte: endOfToday }, isTestData: true });
  console.log('Deleted ' + res.deletedCount + ' today attendances');
  process.exit(0);
}).catch(console.error);
