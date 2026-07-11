import express from 'express';
import { registerUser, authUser, getUserProfile, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);

export default router;
