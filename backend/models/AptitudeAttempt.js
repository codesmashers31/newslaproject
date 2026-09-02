import mongoose from 'mongoose';

const AptitudeAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String },
  studentEmail: { type: String },
  topic: { type: String, required: true },
  difficulty: { type: String, default: 'Medium' },
  totalQuestions: { type: Number, required: true },
  score: { type: Number, required: true },
  accuracy: { type: Number, required: true }, // percentage
  timeTakenSeconds: { type: Number, default: 0 },
  questions: [{
    questionId: String,
    question: String,
    options: [String],
    studentAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    explanation: String,
    shortcutSolution: String
  }],
  aiAnalysis: {
    overallSummary: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String]
  }
}, { timestamps: true });

const AptitudeAttempt = mongoose.model('AptitudeAttempt', AptitudeAttemptSchema);
export default AptitudeAttempt;
