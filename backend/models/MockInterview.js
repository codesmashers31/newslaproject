import mongoose from 'mongoose';

const MockInterviewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, default: 'Full Stack Developer' },
  topic: { type: String, default: 'General Technical & System Design' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  questions: [{
    questionText: String,
    studentAnswer: String,
    score: Number,
    feedback: String,
    idealAnswer: String
  }],
  overallScore: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  feedbackSummary: String
}, { timestamps: true });

const MockInterview = mongoose.model('MockInterview', MockInterviewSchema);
export default MockInterview;
