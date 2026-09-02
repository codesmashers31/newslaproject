import express from 'express';
import { 
  generateTimetablePreview, 
  getMyTimetable, 
  saveMyTimetable, 
  checkSlot, 
  checkAllSlots, 
  getLeaderboard 
} from '../controllers/timetableController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateTimetablePreview);
router.get('/my', protect, getMyTimetable);
router.post('/my', protect, saveMyTimetable);
router.post('/my/check-slot', protect, checkSlot);
router.post('/my/check-all', protect, checkAllSlots);
router.get('/leaderboard', protect, getLeaderboard);

export default router;
