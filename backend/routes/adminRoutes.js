import express from 'express';
import { 
  getDashboardStats, 
  getStudents, 
  addStudent, 
  editStudent, 
  deleteStudent, 
  importStudentsExcel,
  getBatches,
  createBatch,
  editBatch,
  deleteBatch,
  getTrainers,
  addTrainer,
  updateTrainer,
  deleteTrainer,
  updateTrainerStatus,
  resetTrainerPassword,
  updateTrainerBatches,
  updatePlacementDetails,
  getAttendanceLogs,
  importTrainersExcel,
  importBatchesExcel
} from '../controllers/adminController.js';
import { generateStudentAIRoadmapForAdmin } from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Apply protect and authorize('Admin') to all admin endpoints
router.use(protect);
router.use(authorize('Super Admin', 'Admin'));

// Analytics Dashboard
router.get('/stats', getDashboardStats);

// Student CRUD
router.get('/students', getStudents);
router.post('/students', addStudent);
router.put('/students/:id', editStudent);
router.delete('/students/:id', deleteStudent);
router.post('/students/import', upload.single('file'), importStudentsExcel);
router.post('/batches/import', upload.single('file'), importBatchesExcel);
router.post('/trainers/import', upload.single('file'), importTrainersExcel);
router.post('/students/:userId/ai-roadmap', generateStudentAIRoadmapForAdmin);

// Batch Management
router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.put('/batches/:id', editBatch);
router.delete('/batches/:id', deleteBatch);

// Trainer Management
router.get('/trainers', getTrainers);
router.post('/trainers', addTrainer);
router.put('/trainers/:id', updateTrainer);
router.delete('/trainers/:id', deleteTrainer);
router.put('/trainers/:id/status', updateTrainerStatus);
router.put('/trainers/:id/reset-password', resetTrainerPassword);
router.put('/trainers/:id/batches', updateTrainerBatches);

// Placements
router.put('/placements/:studentId', upload.single('offerLetter'), updatePlacementDetails);

// Attendance logs
router.get('/attendance', getAttendanceLogs);

export default router;
