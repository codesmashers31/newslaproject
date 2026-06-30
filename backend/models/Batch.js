import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
