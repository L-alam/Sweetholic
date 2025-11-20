import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware to protect routes - requires valid JWT token
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>',
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: number;
      username: string;
      email: string;
    };

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

// Optional auth - works with or without token
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
        id: number;
        username: string;
        email: string;
      };
      
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
      };
    }
    
    next();
  } catch (error) {
    // Silent fail - continue without user
    next();
  }
};