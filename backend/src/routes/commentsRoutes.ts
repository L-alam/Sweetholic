import { Router } from 'express';
import {
  createComment,
  updateComment,
  deleteComment,
  getPostComments,
  getUserComments,
} from '../controllers/commentsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// POST create a comment on a post (requires auth)
router.post('/:postId', authenticate, createComment);

// PUT update a comment (requires auth)
router.put('/:commentId', authenticate, updateComment);

// DELETE a comment (requires auth)
router.delete('/:commentId', authenticate, deleteComment);

// GET all comments for a post (public)
router.get('/post/:postId', getPostComments);

// GET all comments by a user (public)
router.get('/user/:username', getUserComments);

export default router;