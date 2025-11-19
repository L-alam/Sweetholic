import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../controllers/followsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All follow/unfollow operations require authentication
// POST follow a user
router.post('/:username', authenticate, followUser);

// DELETE unfollow a user
router.delete('/:username', authenticate, unfollowUser);

// GET followers of a user (public)
router.get('/:username/followers', getFollowers);

// GET users that a user is following (public)
router.get('/:username/following', getFollowing);

export default router;