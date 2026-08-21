import mongoose from 'mongoose';
import dns from 'dns';

// Prefer IPv4 for DNS resolution to avoid IPv6 NAT64 lookup timeouts on Windows
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lcp_management', {
      family: 4, // Force IPv4
      serverSelectionTimeoutMS: 5000, // 5s timeout instead of 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 50,
      minPoolSize: 5,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    try {
      await conn.connection.collection('batches').dropIndex('name_1');
      console.log('Dropped legacy unique index name_1 on batches collection');
    } catch (idxError) {
      // Index already dropped or does not exist
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // If initial connection fails, retry in 3 seconds rather than hard exiting
    setTimeout(connectDB, 3000);
  }
};

export default connectDB;
