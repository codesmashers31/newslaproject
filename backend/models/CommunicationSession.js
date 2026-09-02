import mongoose from 'mongoose';

const MistakeCorrectionSchema = new mongoose.Schema({
  originalText: { type: String, required: true },
  improvedVersion: { type: String, required: true },
  category: { type: String, enum: ['Grammar', 'Tense', 'Vocabulary', 'Clarity', 'Filler Words'], default: 'Grammar' },
  explanation: { type: String, required: true }
});

const CommunicationSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String },
  studentEmail: { type: String },
  topic: { type: String, required: true },
  category: { type: String, default: 'General' },
  durationSeconds: { type: Number, default: 0 },
  transcript: { type: String, required: true },
  overallScore: { type: Number, min: 0, max: 100, required: true },
  scores: {
    grammar: { type: Number, default: 70 },
    fluency: { type: Number, default: 70 },
    vocabulary: { type: Number, default: 70 },
    clarity: { type: Number, default: 70 },
    professionalTone: { type: Number, default: 70 },
    technicalCommunication: { type: Number, default: 70 }
  },
  fillerWordCount: { type: Number, default: 0 },
  mistakes: [MistakeCorrectionSchema],
  positiveFeedback: [{ type: String }],
  areasOfImprovement: [{ type: String }],
  idealAnswerOrExample: { type: String }
}, { timestamps: true });

const CommunicationSession = mongoose.model('CommunicationSession', CommunicationSessionSchema);
export default CommunicationSession;
