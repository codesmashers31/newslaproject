import mongoose from 'mongoose';

const LearningPathSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  totalWeeks: { type: Number, default: 8 },
  currentWeek: { type: Number, default: 1 },
  currentDay: { type: Number, default: 1 },
  milestones: [{
    weekNumber: Number,
    title: String,
    learningObjectives: [String],
    isCompleted: { type: Boolean, default: false }
  }]
}, { timestamps: true });

const LearningPath = mongoose.model('LearningPath', LearningPathSchema);
export default LearningPath;
