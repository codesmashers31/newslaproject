import express from 'express';
import { 
  getStudentDashboard, 
  updateStudentProfile, 
  claimCertificate,
  getNotifications,
  markNotificationsAsRead,
  scanQR,
  getLeaderboard
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Student', 'Super Admin', 'Admin'));

router.get('/dashboard', getStudentDashboard);

router.put('/profile', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), updateStudentProfile);

router.post('/certificate', claimCertificate);

router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsAsRead);
router.post('/attendance/scan', scanQR);
router.get('/leaderboard', getLeaderboard);

export default router;
