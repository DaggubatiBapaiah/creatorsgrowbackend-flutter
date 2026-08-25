import { Router, Request, Response } from 'express';
import { pool } from '../config/db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Basic DB connectivity health check without credentials leakage
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    return res.status(200).json({
      status: 'degraded',
      database: 'disconnected',
    });
  }
});

export default router;
