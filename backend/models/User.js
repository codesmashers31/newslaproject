import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Super Admin', 'Admin', 'Student', 'Aptitude Trainer', 'Communication Trainer', 'Technical Trainer'],
  },
  photo: {
    type: String,
    default: '',
  },
  slaeId: {
    type: String,
    trim: true,
  },
  trainerId: {
    type: String,
    trim: true,
  },
  stacks: [{
    type: String,
  }],
  skills: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed', 'Enrolled'],
    default: 'Active',
  },
  isBatchesLocked: {
    type: Boolean,
    default: false
  },
  trainerAvailability: [{
    dayOfWeek: {
      type: String, // 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      required: true,
    },
    startTime: {
      type: String, // HH:MM
      required: true,
    },
    endTime: {
      type: String, // HH:MM
      required: true,
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
