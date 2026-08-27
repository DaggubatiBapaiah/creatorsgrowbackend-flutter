import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SocialController } from '../controllers/social.controller';
import { authLimiter } from '../middleware/rate-limit';

const router = Router();
const authController = new AuthController();
const socialController = new SocialController();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

export default router;

router.get('/:platform/callback', socialController.callback);
