import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage/storage.service';
import { pool } from '../config/db';

export class MediaController {
  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const userId = req.user!.id;
      
      let type = 'image';
      if (file.mimetype.startsWith('video/')) {
        type = 'video';
      } else if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      const url = await storageService.uploadFile(file.buffer, file.originalname, file.mimetype);

      const query = `
        INSERT INTO media_assets (user_id, type, url)
        VALUES ($1, $2, $3)
        RETURNING id, type, url, created_at
      `;
      const { rows } = await pool.query(query, [userId, type, url]);
      const media = rows[0];

      return res.status(201).json({ media });
    } catch (error) {
      next(error);
    }
  };
}
