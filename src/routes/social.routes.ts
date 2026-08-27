import { Router } from 'express';
import { SocialController } from '../controllers/social.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const socialController = new SocialController();

router.get('/accounts', authenticate, socialController.getAccounts);
router.delete('/accounts/:id', authenticate, socialController.disconnectAccount);

// Changed to POST and requires authentication
router.post('/:platform/connect', authenticate, socialController.connect);

// Callback remains GET as it's hit by the browser redirect
// Callback moved to auth.routes.ts

export default router;
