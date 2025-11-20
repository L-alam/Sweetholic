import { Router } from 'express';
import {
  addReaction,
  removeReaction,
  getPostReactions,
  getReactionUsers,
} from '../controllers/reactionsController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// POST add reaction to a post (requires auth)
router.post('/:postId', authenticate, addReaction);

// DELETE remove reaction from a post (requires auth)
router.delete('/:postId/:reactionType', authenticate, removeReaction);

// GET all reactions for a post (optional auth to see user's reactions)
router.get('/:postId', optionalAuthenticate, getPostReactions);

// GET users who reacted with a specific type (public)
router.get('/:postId/:reactionType/users', getReactionUsers);

export default router;