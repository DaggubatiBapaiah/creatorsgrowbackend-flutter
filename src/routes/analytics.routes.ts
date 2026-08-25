import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/dashboard', controller.getDashboardStats);
router.get('/post/:postId', controller.getPostAnalytics);

export default router;
