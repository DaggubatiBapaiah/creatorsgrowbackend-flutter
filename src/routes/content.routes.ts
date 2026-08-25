import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { ContentController } from '../controllers/content.controller';

export const contentRouter = Router();
const contentController = new ContentController();

contentRouter.use(authenticate);

contentRouter.post('/', contentController.createPost);
contentRouter.get('/', contentController.getPosts);
contentRouter.put('/:id', contentController.updatePost);
contentRouter.delete('/:id', contentController.deletePost);
contentRouter.post('/:id/cancel', contentController.cancelPost);
