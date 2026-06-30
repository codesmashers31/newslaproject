import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  photo: {
    type: String,
    default: '',
  },
  collegeName: {
    type: String,
    default: '',
  },
  degree: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  yearOfPassing: {
    type: String,
    default: '',
  },
  dob: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  linkedin: {
    type: String,
    default: '',
  },
  github: {
    type: String,
    default: '',
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
