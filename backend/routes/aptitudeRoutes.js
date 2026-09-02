import express from 'express';
import { 
  getTopics, 
  generateTest, 
  submitTest, 
  solveQuestion, 
  getFoundations, 
  getTopicGuide, 
  getMyHistory 
} from '../controllers/aptitudeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/topics', protect, getTopics);
router.post('/generate-test', protect, generateTest);
router.post('/submit-test', protect, submitTest);
router.post('/solve-question', protect, solveQuestion);
router.get('/foundations', protect, getFoundations);
router.get('/topic-guide/:topicName', protect, getTopicGuide);
router.get('/my-history', protect, getMyHistory);

export default router;
