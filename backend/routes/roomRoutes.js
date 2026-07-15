import express from 'express';
import { createRoom, getRooms, updateRoom, toggleRoomStatus } from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and restricted to Super Admin & Admin
router.use(protect);
router.use(authorize('Super Admin', 'Admin'));

router.route('/')
  .post(createRoom)
  .get(getRooms);

router.route('/:id')
  .put(updateRoom);

router.route('/:id/status')
  .put(toggleRoomStatus);

export default router;
