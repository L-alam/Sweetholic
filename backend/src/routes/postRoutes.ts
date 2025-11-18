import { Router } from 'express';
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getUserPosts,
  getFeed,
} from '../controllers/postController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Protected routes - require authentication
router.post('/', authenticate, createPost);
router.put('/:postId', authenticate, updatePost);
router.delete('/:postId', authenticate, deletePost);

// Public routes - can be viewed by anyone
router.get('/feed', getFeed); // Get feed of posts
router.get('/user/:username', getUserPosts); // Get posts by specific user
router.get('/:postId', getPost); // Get single post

export default router;