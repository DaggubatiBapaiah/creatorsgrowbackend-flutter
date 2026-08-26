import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new CrmController();

router.use(authenticate);

router.get('/deals', controller.getDeals);
router.post('/deals', controller.createDeal);
router.get('/deals/:id', controller.getDealById);
router.put('/deals/:id', controller.updateDeal);
router.delete('/deals/:id', controller.deleteDeal);

export default router;
