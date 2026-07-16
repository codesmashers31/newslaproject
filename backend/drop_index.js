import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    try {
      await mongoose.connection.collection('attendances').dropIndex('student_1_batch_1_date_1');
      console.log('Successfully dropped old attendance index');
    } catch (e) {
      console.error('Index might not exist or error:', e.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
