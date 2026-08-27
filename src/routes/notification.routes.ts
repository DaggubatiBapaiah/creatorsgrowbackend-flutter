import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.getNotifications);
router.post('/:id/read', controller.markRead);
router.get('/preferences', controller.getPreferences);
router.put('/preferences', controller.updatePreferences);

export default router;