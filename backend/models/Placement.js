import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  resumeUploaded: {
    type: Boolean,
    default: false,
  },
  mockInterviewCompleted: {
    type: Boolean,
    default: false,
  },
  technicalInterviewCompleted: {
    type: Boolean,
    default: false,
  },
  hrInterviewCompleted: {
    type: Boolean,
    default: false,
  },
  companyName: {
    type: String,
    default: '',
    trim: true,
  },
  interviewDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['Not Started', 'Pending', 'Selected', 'Rejected', 'Offer Received'],
    default: 'Not Started',
  },
  offerLetterUrl: {
    type: String,
    default: '',
  },
  joiningDate: {
    type: Date,
    default: null,
  },
  communicationMocks: {
    type: [Boolean],
    default: [false, false, false],
  },
  placementEnhancement: {
    type: [Boolean],
    default: [false, false, false, false, false],
  },
  technicalMocks: {
    type: [Boolean],
    default: [false, false, false],
  },
}, {
  timestamps: true,
});

const Placement = mongoose.model('Placement', placementSchema);
export default Placement;
