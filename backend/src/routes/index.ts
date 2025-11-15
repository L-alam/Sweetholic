import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';

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
    },
  });
});

export default router;