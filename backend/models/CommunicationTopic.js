import mongoose from 'mongoose';

const CommunicationTopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['HR & Self Introduction', 'Project & Technical', 'Behavioral & Leadership', 'Problem Solving'], 
    default: 'Project & Technical' 
  },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  description: { type: String, required: true },
  keyPointsToCover: [{ type: String }],
  recommendedDurationSeconds: { type: Number, default: 90 },
  vocabularyHints: [{ type: String }]
}, { timestamps: true });

const CommunicationTopic = mongoose.model('CommunicationTopic', CommunicationTopicSchema);
export default CommunicationTopic;
