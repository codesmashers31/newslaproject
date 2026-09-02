import mongoose from 'mongoose';

const AptitudeTopicSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: ['Arithmetic', 'Commercial Math', 'Algebra', 'Geometry & Mensuration', 'Modern Math & DI'], 
    required: true 
  },
  description: { type: String },
  difficultyLevel: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

const AptitudeTopic = mongoose.model('AptitudeTopic', AptitudeTopicSchema);
export default AptitudeTopic;
