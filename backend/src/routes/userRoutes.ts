import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  searchUsers,
  getUserStats,
} from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All user routes require authentication
// GET user profile by username (public - anyone can view)
router.get('/:username', getUserProfile);

// GET current user's stats
router.get('/:username/stats', getUserStats);

// PUT update current user's profile (protected - only own profile)
router.put('/profile', authenticate, updateUserProfile);

// DELETE current user's account (protected - only own account)
router.delete('/account', authenticate, deleteUserAccount);

// GET search users (public with optional auth for personalized results)
router.get('/', searchUsers);

export default router;