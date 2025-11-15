import { Request, Response } from 'express';
import pool from '../config/database';

// Health check endpoint
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.status(200).json({
      success: true,
      message: 'API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'API is running but database is unavailable',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
};