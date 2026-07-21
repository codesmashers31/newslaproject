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
  isTechnicalLocked: {
    type: Boolean,
    default: false
  },
  isAptitudeLocked: {
    type: Boolean,
    default: false
  },
  deviceId: {
    type: String,
    default: null,
  },
  deviceInfo: {
    type: String,
    default: '',
  },
  deviceLastUsed: {
    type: Date,
    default: null,
  },
  isDeviceLocked: {
    type: Boolean,
    default: false,
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

// Hash password before saving if not already hashed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$'))) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password with plaintext fallback for bulk-imported accounts
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || typeof this.password !== 'string') return false;

  // Handle plain text passwords (e.g. from bulk import)
  if (!this.password.startsWith('$2')) {
    const isExact = enteredPassword === this.password;
    const isCaseInsensitive = enteredPassword.toLowerCase() === this.password.toLowerCase();
    if (isExact || isCaseInsensitive) {
      // Auto-upgrade plain text password to bcrypt hash
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(enteredPassword, salt);
        await this.save();
      } catch (err) {
        console.error('Password hash upgrade error:', err);
      }
      return true;
    }
    return false;
  }

  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    return false;
  }
};

const User = mongoose.model('User', userSchema);
export default User;
