import express from 'express';
import { 
  getAssignedStudents, 
  markAttendance, 
  updateStudentScore,
  startSession,
  getQRToken
} from '../controllers/trainerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Super Admin', 'Admin'));

router.get('/students', getAssignedStudents);
router.post('/attendance', markAttendance);
router.post('/score', updateStudentScore);
router.post('/session/start', startSession);
router.get('/session/:sessionId/qr', getQRToken);

export default router;
