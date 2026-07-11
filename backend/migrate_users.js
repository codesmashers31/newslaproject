import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const run = async () => {
  try {
    // 1. Connect to the 'test' database
    const testUri = mongoUri.replace('/sladb', '/test');
    console.log("Connecting to test database...");
    await mongoose.connect(testUri);
    
    // Fetch all users in 'test'
    const testUsers = await User.find().lean();
    console.log(`Found ${testUsers.length} users in 'test' database.`);
    
    await mongoose.disconnect();

    // 2. Connect to the 'sladb' database
    console.log("Connecting to sladb database...");
    await mongoose.connect(mongoUri);

    let copiedCount = 0;
    for (const u of testUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        // Normalize role to uppercase if it is 'student' or 'admin'
        if (u.role === 'student') u.role = 'Student';
        if (u.role === 'admin') u.role = 'Admin';
        
        // Add fallback mobile if missing
        if (!u.mobile) u.mobile = '0000000000';

        // Insert directly to bypass strict validations
        await User.collection.insertOne(u);
        console.log(`Copied user: ${u.name} (${u.email})`);
        copiedCount++;
      } else {
        console.log(`User already exists in sladb: ${u.name} (${u.email})`);
      }
    }

    console.log(`Migration complete. Copied ${copiedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

run();
