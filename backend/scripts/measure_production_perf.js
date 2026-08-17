import http from 'http';
import https from 'https';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Batch from '../models/Batch.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Score from '../models/Score.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const RENDER_URL = 'https://newslaproject.onrender.com/api/health';

function fetchUrlTiming(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          duration,
          sizeBytes: Buffer.byteLength(data),
          body: data
        });
      });
    }).on('error', (err) => {
      resolve({ statusCode: 500, duration: Date.now() - start, error: err.message });
    });
  });
}

async function auditProductionPerformance() {
  console.log('========================================================================');
  console.log('         PRODUCTION ARCHITECTURE & LATENCY INVESTIGATION               ');
  console.log('========================================================================\n');

  // 1. Render Backend Cold Start vs Warm Start Audit
  console.log('--- 1. RENDER BACKEND HEALTH ENDPOINT LATENCY (COLD vs WARM) ---');
  console.log(`Pinging ${RENDER_URL}...`);
  
  const req1 = await fetchUrlTiming(RENDER_URL);
  console.log(`Request 1 (Potential Cold Start): Status ${req1.statusCode} in ${req1.duration} ms (${req1.sizeBytes || 0} bytes)`);

  const req2 = await fetchUrlTiming(RENDER_URL);
  console.log(`Request 2 (Warm Start): Status ${req2.statusCode} in ${req2.duration} ms (${req2.sizeBytes || 0} bytes)`);

  const req3 = await fetchUrlTiming(RENDER_URL);
  console.log(`Request 3 (Warm Start): Status ${req3.statusCode} in ${req3.duration} ms (${req3.sizeBytes || 0} bytes)`);

  // 2. Production Database Index Audit
  console.log('\n--- 2. PRODUCTION MONGODB CLUSTER INDEX AUDIT ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Production MongoDB Cluster:', mongoose.connection.host);

    const userIndexes = await User.collection.indexes();
    const enrollIndexes = await Enrollment.collection.indexes();
    const attIndexes = await Attendance.collection.indexes();
    const batchIndexes = await Batch.collection.indexes();
    const scoreIndexes = await Score.collection.indexes();

    console.log(`User Indexes (${userIndexes.length}):`, userIndexes.map(i => Object.keys(i.key).join('+')));
    console.log(`Enrollment Indexes (${enrollIndexes.length}):`, enrollIndexes.map(i => Object.keys(i.key).join('+')));
    console.log(`Attendance Indexes (${attIndexes.length}):`, attIndexes.map(i => Object.keys(i.key).join('+')));
    console.log(`Batch Indexes (${batchIndexes.length}):`, batchIndexes.map(i => Object.keys(i.key).join('+')));
    console.log(`Score Indexes (${scoreIndexes.length}):`, scoreIndexes.map(i => Object.keys(i.key).join('+')));

    // 3. Document Counts
    const userCount = await User.countDocuments();
    const enrollCount = await Enrollment.countDocuments();
    const attCount = await Attendance.countDocuments();
    const batchCount = await Batch.countDocuments();
    const scoreCount = await Score.countDocuments();

    console.log('\nProduction Document Counts:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Enrollments: ${enrollCount}`);
    console.log(`- Attendance Logs: ${attCount}`);
    console.log(`- Batches: ${batchCount}`);
    console.log(`- Scores: ${scoreCount}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Production MongoDB connection error:', err.message);
  }

  console.log('\n========================================================================');
  console.log('              PRODUCTION AUDIT DATA FETCHING COMPLETE 🎉               ');
  console.log('========================================================================\n');
}

auditProductionPerformance().catch(console.error);
