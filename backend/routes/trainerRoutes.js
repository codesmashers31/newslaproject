import express from 'express';
import { 
  getAssignedStudents, 
  markAttendance, 
  updateStudentScore,
  startSession,
  getQRToken,
  getTrainerDashboardStats,
  getTrainerBatches,
  getBatchAttendance,
  createBatchByTrainer,
  updateBatchByTrainer,
  deleteBatchByTrainer,
  addStudentByTrainer,
  updateStudentByTrainer,
  deleteStudentByTrainer
} from '../controllers/trainerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Super Admin', 'Admin'));

import {
  getTrainers,
  addTrainer,
  updateTrainer,
  deleteTrainer,
  importStudentsExcel
} from '../controllers/adminController.js';
import upload from '../middleware/upload.js';

router.get('/dashboard-stats', getTrainerDashboardStats);
router.get('/students', getAssignedStudents);
router.post('/students', addStudentByTrainer);
router.put('/students/:id', updateStudentByTrainer);
router.delete('/students/:id', deleteStudentByTrainer);
router.post('/students/import', upload.single('file'), importStudentsExcel);

router.get('/trainers', getTrainers);
router.post('/trainers', addTrainer);
router.put('/trainers/:id', updateTrainer);
router.delete('/trainers/:id', deleteTrainer);

router.get('/batches', getTrainerBatches);
router.post('/batches', createBatchByTrainer);
router.put('/batches/:id', updateBatchByTrainer);
router.delete('/batches/:id', deleteBatchByTrainer);
router.get('/attendance', getBatchAttendance);
router.post('/attendance', markAttendance);
router.post('/score', updateStudentScore);
router.post('/session/start', startSession);
router.get('/session/:sessionId/qr', getQRToken);

export default router;
