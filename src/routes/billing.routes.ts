import { Router } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new BillingController();

router.post('/webhook', controller.handleWebhook);

router.use(authenticate);
router.get('/status', controller.getStatus);
router.post('/checkout', controller.createCheckout);

export default router;