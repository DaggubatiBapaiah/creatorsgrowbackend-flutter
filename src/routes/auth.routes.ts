import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SocialController } from '../controllers/social.controller';
import { authLimiter } from '../middleware/rate-limit';
import { env } from '../config/env';

const router = Router();
const authController = new AuthController();
const socialController = new SocialController();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);

// Safe diagnostic endpoint to verify env config on Vercel
router.get('/diagnostic', (req, res) => {
  res.json({
    INSTAGRAM_APP_ID: env.INSTAGRAM_APP_ID || 'missing',
    HAS_INSTAGRAM_SECRET: !!env.INSTAGRAM_APP_SECRET,
    META_APP_ID: env.META_APP_ID || 'missing',
    HAS_META_SECRET: !!env.META_APP_SECRET,
    META_REDIRECT_URI: env.META_REDIRECT_URI,
    META_OAUTH_MODE: env.META_OAUTH_MODE,
  });
});

router.get('/:platform/callback', socialController.callback);

export default router;
