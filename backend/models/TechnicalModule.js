import mongoose from 'mongoose';

const technicalModuleSchema = new mongoose.Schema({
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

const TechnicalModule = mongoose.model('TechnicalModule', technicalModuleSchema);
export default TechnicalModule;
