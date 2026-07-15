import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  facilities: [{
    type: String,
    trim: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
