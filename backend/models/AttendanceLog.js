import mongoose from 'mongoose';

const attendanceLogSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    default: null,
  },
  scannedToken: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    required: true,
  },
  reason: {
    type: String,
    default: '',
    trim: true,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Enforce immutability using a pre-save/pre-update hook
attendanceLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('AttendanceLog records are immutable and cannot be modified.'));
  }
  next();
});

attendanceLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('AttendanceLog records are immutable and cannot be updated.'));
});

attendanceLogSchema.pre('updateOne', function(next) {
  next(new Error('AttendanceLog records are immutable and cannot be updated.'));
});

attendanceLogSchema.pre('updateMany', function(next) {
  next(new Error('AttendanceLog records are immutable and cannot be updated.'));
});

attendanceLogSchema.pre('deleteOne', function(next) {
  next(new Error('AttendanceLog records are immutable and cannot be deleted.'));
});

attendanceLogSchema.pre('deleteMany', function(next) {
  next(new Error('AttendanceLog records are immutable and cannot be deleted.'));
});

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);
export default AttendanceLog;
