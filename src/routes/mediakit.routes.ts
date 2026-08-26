import { Router } from 'express';
import { MediaKitController } from '../controllers/mediakit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new MediaKitController();

// Public unauthenticated route (rate limited via app defaults)
router.get('/public/kit/:identifier', controller.renderPublicKit);

// Private authenticated routes
router.get('/config', authenticate, controller.getConfig);
router.post('/config', authenticate, controller.saveConfig);

export default router;
