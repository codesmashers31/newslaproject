import { authorizeStudentAttendance } from '../middleware/attendanceAccess.js';
import express from 'express';
import {
  getStudentAttendance,
  getStudentMonthlySummary,
  getStudentAttendanceHistory,
  getStudentPresentDates,
  getStudentLeaveDates,
  getStudentAbsentDates,
  getBatchAttendanceSummary,
  getBatchDailyAttendance,
  markSingleManualAttendance,
  submitBulkAttendance,
  updateAttendanceRecord,
  submitScanAttendance
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated Routes
router.use(protect);

// Student Attendance Endpoints (Web + Mobile)
router.get('/student/:studentId', authorizeStudentAttendance, getStudentAttendance);
router.get('/student/:studentId/summary', authorizeStudentAttendance, getStudentMonthlySummary);
router.get('/student/:studentId/history', authorizeStudentAttendance, getStudentAttendanceHistory);
router.get('/student/:studentId/present-dates', authorizeStudentAttendance, getStudentPresentDates);
router.get('/student/:studentId/leave-dates', authorizeStudentAttendance, getStudentLeaveDates);
router.get('/student/:studentId/absent-dates', authorizeStudentAttendance, getStudentAbsentDates);

// Scan Attendance Endpoint (Shared across Web & Mobile)
router.post('/scan', authorize('Student', 'Admin', 'Super Admin'), submitScanAttendance);

// Trainer & Admin Only Endpoints
router.get('/batch/:batchId', authorize('Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Admin', 'Super Admin'), getBatchAttendanceSummary);
router.get('/batch/:batchId/date/:date', authorize('Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Admin', 'Super Admin'), getBatchDailyAttendance);
router.post('/manual', authorize('Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Admin', 'Super Admin'), markSingleManualAttendance);
router.post('/bulk', authorize('Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Admin', 'Super Admin'), submitBulkAttendance);
router.put('/:attendanceId', authorize('Aptitude Trainer', 'Communication Trainer', 'Technical Trainer', 'Admin', 'Super Admin'), updateAttendanceRecord);

export default router;
