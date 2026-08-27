import { Router } from 'express';
import { InboxController } from '../controllers/inbox.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new InboxController();

router.use(authenticate);

router.get('/', controller.getItems);
router.post('/:id/reply', controller.reply);
router.post('/:id/read', controller.markRead);
router.post('/:id/like', controller.toggleLike);
router.post('/:id/hide', controller.toggleHide);
router.delete('/:id', controller.deleteItem);

export default router;