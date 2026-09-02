import mongoose from 'mongoose';

const ReadinessScoreSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  overallScore: { type: Number, default: 50 },
  technicalScore: { type: Number, default: 50 },
  codingScore: { type: Number, default: 50 },
  communicationScore: { type: Number, default: 50 },
  assignmentScore: { type: Number, default: 50 },
  attendanceScore: { type: Number, default: 50 },
  mockScore: { type: Number, default: 50 },
  tierEligibility: { 
    type: String, 
    enum: ['Needs Preparation', 'Eligible Service', 'Eligible Product Tier-1'], 
    default: 'Needs Preparation' 
  },
  lastCalculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ReadinessScore = mongoose.model('ReadinessScore', ReadinessScoreSchema);
export default ReadinessScore;
