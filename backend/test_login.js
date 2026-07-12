import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
  const input = '5810';
  const password = '5810';

  console.log(`Searching for user with slaeId: "${input}"...`);
  const user = await User.findOne({
    $or: [
      { email: input.toLowerCase() },
      { slaeId: input },
      { slaeId: input.toUpperCase() },
      { slaeId: input.toLowerCase() }
    ]
  });

  if (!user) {
    console.log('Error: User not found in DB!');
  } else {
    console.log('User found:', { id: user._id, name: user.name, email: user.email, slaeId: user.slaeId });
    console.log('Comparing passwords...');
    const isMatch = await user.matchPassword(password);
    console.log(`Password match result: ${isMatch}`);
  }
  mongoose.disconnect();
};

test();
