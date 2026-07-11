import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lcp_management');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    try {
      await conn.connection.collection('batches').dropIndex('name_1');
      console.log('Dropped legacy unique index name_1 on batches collection');
    } catch (idxError) {
      // Index already dropped or does not exist
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
