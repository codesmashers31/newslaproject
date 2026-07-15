import mongoose from 'mongoose';

const roomAllocationSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  batch: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true,
  }],
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // HH:MM
    required: true,
  },
  endTime: {
    type: String, // HH:MM
    required: true,
  },
  status: {
    type: String,
    enum: ['Reserved', 'Occupied', 'Completed'],
    default: 'Reserved',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to help query allocations by date
roomAllocationSchema.index({ date: 1, startTime: 1, endTime: 1 });

const RoomAllocation = mongoose.model('RoomAllocation', roomAllocationSchema);
export default RoomAllocation;
