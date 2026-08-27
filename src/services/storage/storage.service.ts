import fs from 'fs';
import path from 'path';

export interface StorageService {
  uploadFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
}

export class LocalStorageService implements StorageService {
  private uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = path.extname(originalName) || '';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);
    
    fs.writeFileSync(filePath, buffer);
    
    return `/uploads/${filename}`;
  }
}

export const storageService: StorageService = new LocalStorageService();
