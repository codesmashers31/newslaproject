import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  certificateUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
