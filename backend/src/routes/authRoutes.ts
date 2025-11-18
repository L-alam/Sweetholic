import { Router } from 'express';
import { signup, login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no auth required)
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (auth required)
router.get('/me', authenticate, getCurrentUser);

export default router;