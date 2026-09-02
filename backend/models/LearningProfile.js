import mongoose from 'mongoose';

const LearningProfileSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  targetRole: { type: String, default: 'Full Stack Developer' },
  targetCompanyTier: { 
    type: String, 
    enum: ['Service (TCS/Wipro)', 'Product (Zoho/Freshworks)', 'FAANG/Tier-1'], 
    default: 'Product (Zoho/Freshworks)' 
  },
  skillLevel: {
    dsa: { type: Number, min: 1, max: 5, default: 2 },
    frontend: { type: Number, min: 1, max: 5, default: 2 },
    backend: { type: Number, min: 1, max: 5, default: 2 },
    database: { type: Number, min: 1, max: 5, default: 2 }
  },
  commLevel: { type: Number, min: 1, max: 5, default: 3 },
  dailyHoursCommitment: { type: Number, default: 3 }
}, { timestamps: true });

const LearningProfile = mongoose.model('LearningProfile', LearningProfileSchema);
export default LearningProfile;
