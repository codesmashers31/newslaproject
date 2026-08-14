import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isInstituteHoliday: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Holiday = mongoose.model('Holiday', holidaySchema);
export default Holiday;
