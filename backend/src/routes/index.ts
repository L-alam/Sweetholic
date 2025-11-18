import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import postRoutes from './postRoutes';

const router = Router();

// Health check route
router.get('/health', healthCheck);

// API info route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to SweetHolic API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      posts: '/api/posts/*',
    },
  });
});

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Post routes
router.use('/posts', postRoutes);

export default router;