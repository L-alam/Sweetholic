import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import postRoutes from './postRoutes';
import followsRoutes from './followsRoutes';

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
      follows: '/api/follows/*',
    },
  });
});

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Post routes
router.use('/posts', postRoutes);

// Follow routes
router.use('/follows', followsRoutes);

export default router;