import mongoose from 'mongoose';

const communicationModuleSchema = new mongoose.Schema({
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

const CommunicationModule = mongoose.model('CommunicationModule', communicationModuleSchema);
export default CommunicationModule;
