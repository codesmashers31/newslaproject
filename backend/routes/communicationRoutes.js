import express from 'express';
import { 
  getTopics, 
  generateTopic, 
  submitSpeech, 
  getMyHistory, 
  getMyAnalytics 
} from '../controllers/communicationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/topics', protect, getTopics);
router.post('/generate-topic', protect, generateTopic);
router.post('/submit-speech', protect, submitSpeech);
router.get('/my-history', protect, getMyHistory);
router.get('/my-analytics', protect, getMyAnalytics);

export default router;
