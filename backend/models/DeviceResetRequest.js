import mongoose from 'mongoose';

const deviceResetRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  requestedDevice: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  adminComment: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const DeviceResetRequest = mongoose.model('DeviceResetRequest', deviceResetRequestSchema);
export default DeviceResetRequest;
