import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  course: {
    type: String,
    required: true,
    trim: true,
  },
  trainers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  trainerName: {
    type: String,
    trim: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  batchId: {
    type: String,
    trim: true,
  },
  schedule: {
    type: String,
    trim: true,
    default: '09:00 AM - 11:00 AM',
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  startTime: {
    type: String,
    trim: true,
  },
  endTime: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed', 'Upcoming'],
    default: 'Active',
  },
});

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
