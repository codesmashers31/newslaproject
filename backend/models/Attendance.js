import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
  },
  course: {
    type: String,
    default: '',
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Present', 'Absent', 'Leave', 'Late', 'Excused', 'PRESENT', 'ABSENT', 'LEAVE'],
    default: 'Present',
  },
  attendanceMode: {
    type: String,
    enum: ['MANUAL', 'SCAN', 'Manual', 'Scan'],
    default: 'MANUAL',
  },
  remarks: {
    type: String,
    default: '',
  },
  timeIn: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    required: false,
    default: 'General',
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    default: null,
  },
  scannedBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Compound indexes for high-speed queries and duplicate prevention
attendanceSchema.index({ student: 1, batch: 1, date: 1 }, { unique: true });
attendanceSchema.index({ student: 1, batch: 1, date: 1, subject: 1 });
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ batch: 1, date: 1 });
attendanceSchema.index({ student: 1, status: 1, date: 1 });
attendanceSchema.index({ date: 1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
