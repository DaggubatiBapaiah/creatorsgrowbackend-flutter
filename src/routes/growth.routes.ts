import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { GrowthController } from '../controllers/growth.controller';

const router = Router();
const controller = new GrowthController();

router.use(authenticate);

router.get('/score', controller.getGrowthScore);
router.get('/best-times', controller.getBestTimes);
router.get('/content-analysis', controller.getContentAnalysis);
router.get('/recommendations', controller.getRecommendations);

export default router;
