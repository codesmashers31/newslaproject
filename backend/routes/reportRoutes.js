import express from 'express';
import { 
  getDashboardStats, 
  getUtilizationReport, 
  getDailyUsageReport, 
  getMonthlyUsageReport 
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and restricted to Super Admin
router.use(protect);
router.use(authorize('Super Admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/utilization', getUtilizationReport);
router.get('/daily', getDailyUsageReport);
router.get('/monthly', getMonthlyUsageReport);

export default router;
