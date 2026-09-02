import express from 'express';
import { 
  getProfile, 
  saveOnboarding, 
  getRoadmap, 
  getTodayPlan, 
  toggleDayProgress, 
  getReadinessScore, 
  generateMockInterview, 
  evaluateMockInterview 
} from '../controllers/aiMentorshipController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.post('/onboarding', protect, saveOnboarding);
router.get('/roadmap', protect, getRoadmap);
router.get('/today', protect, getTodayPlan);
router.post('/day-progress/toggle', protect, toggleDayProgress);
router.get('/readiness-score', protect, getReadinessScore);
router.post('/mock/generate', protect, generateMockInterview);
router.post('/mock/evaluate', protect, evaluateMockInterview);

export default router;
