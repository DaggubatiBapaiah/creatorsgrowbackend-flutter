import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new AIController();

// 5 requests per 15 minutes, keyed by authenticated user ID.
// Falls back to IP if user is not yet set (belt-and-suspenders; authenticate runs first).
const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    return (req as any).user?.id ?? req.ip ?? 'unknown';
  },
  message: { error: { message: 'Rate limit exceeded. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);
router.post('/generate-caption', aiRateLimiter, controller.generateCaption);

export default router;
