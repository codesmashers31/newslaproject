import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  moduleName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Aptitude', 'Communication', 'Technical'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Not Started', 'In Progress', 'Completed', 'Mastered'],
    default: 'Not Started',
  },
  marks: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
    default: 0,
  },
  remarks: {
    type: String,
    default: '',
    trim: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure a student has at most one score entry per module
scoreSchema.index({ student: 1, moduleName: 1, category: 1 }, { unique: true });

scoreSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Score = mongoose.model('Score', scoreSchema);
export default Score;
