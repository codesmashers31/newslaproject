import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
  },
  category: {
    type: String,
    enum: ['Aptitude', 'Communication', 'Technical'],
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    marks: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    remarks: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Pending', 'Graded'],
      default: 'Pending',
    }
  }]
}, {
  timestamps: true,
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
