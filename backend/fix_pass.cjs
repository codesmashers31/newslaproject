require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('sla001', salt);
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'sanjeev@gmail.com' },
    { $set: { password: hash } }
  );
  console.log('Password updated successfully to sla001');
  process.exit(0);
}).catch(console.error);
