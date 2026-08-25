import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { MediaController } from '../controllers/media.controller';

export const mediaRouter = Router();
const mediaController = new MediaController();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

mediaRouter.use(authenticate);
mediaRouter.post('/upload', upload.single('file'), mediaController.upload);
