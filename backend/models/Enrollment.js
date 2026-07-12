import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
    type: String,
    enum: ['Technical', 'Communication', 'Aptitude'],
    required: true
  },
  course: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Dropped'],
    default: 'Active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  remarks: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Prevent duplicate active enrollments for the same student in the same batch
enrollmentSchema.index({ studentId: 1, batchId: 1, status: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
