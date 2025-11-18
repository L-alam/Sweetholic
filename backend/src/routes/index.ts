import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import authRoutes from './authRoutes';

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
    },
  });
});

// Auth routes
router.use('/auth', authRoutes);

export default router;