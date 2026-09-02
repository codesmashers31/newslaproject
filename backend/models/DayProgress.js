import mongoose from 'mongoose';

const DayProgressSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayNumber: { type: Number, required: true },
  topicTitle: { type: String, required: true },
  tasks: {
    theory: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    coding: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    quiz: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
  },
  quizScore: { type: Number },
  isDayCompleted: { type: Boolean, default: false }
}, { timestamps: true });

const DayProgress = mongoose.model('DayProgress', DayProgressSchema);
export default DayProgress;
