import express from 'express';
import { 
  createAllocation, 
  getAllocations, 
  updateAllocation, 
  deleteAllocation, 
  checkAvailability 
} from '../controllers/allocationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and restricted to Super Admin & Admin
router.use(protect);
router.use(authorize('Super Admin', 'Admin'));

router.route('/')
  .post(createAllocation)
  .get(getAllocations);

router.route('/check-availability')
  .post(checkAvailability);

router.route('/:id')
  .put(updateAllocation)
  .delete(deleteAllocation);

export default router;
