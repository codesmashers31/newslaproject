const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await mongoose.connection.db.collection('users').find({isTestData: true, role: 'Student'}).toArray();
  const salt = await bcrypt.genSalt(10);
  let count = 0;
  for (const user of users) {
    const slaeIdLower = user.slaeId.toLowerCase();
    const hash = await bcrypt.hash(slaeIdLower, salt);
    await mongoose.connection.db.collection('users').updateOne({_id: user._id}, {$set: {password: hash}});
    count++;
  }
  console.log(`Updated ${count} student passwords to lowercase.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
