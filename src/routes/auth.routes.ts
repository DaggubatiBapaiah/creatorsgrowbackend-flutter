import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limit';

const router = Router();
const authController = new AuthController();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

export default router;
