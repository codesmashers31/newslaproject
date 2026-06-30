import mongoose from 'mongoose';

const aptitudeModuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const AptitudeModule = mongoose.model('AptitudeModule', aptitudeModuleSchema);
export default AptitudeModule;
