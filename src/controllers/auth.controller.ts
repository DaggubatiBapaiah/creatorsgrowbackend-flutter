import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters long').max(50),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    console.log('AUTH_REGISTER_RECEIVED');
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.format());
      }

      console.log('AUTH_REGISTER_VALIDATION_OK');
      const { email, password, displayName } = parsed.data;
      console.log('AUTH_REGISTER_DB_START');
      const session = await this.authService.register(email, password, displayName);
      return res.status(201).json(session);
    } catch (error: any) {
      console.log('AUTH_REGISTER_ERROR', error);
      res.status(500).json({ error: error.message, detail: error.detail });
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.format());
      }

      const { email, password } = parsed.data;
      const session = await this.authService.login(email, password);
      return res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User is verified by authentication middleware and stored in req.user
      const userId = req.user!.id;
      const currentUser = await this.authService.getCurrentUser(userId);
      return res.status(200).json({ user: currentUser });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For short-lived JWT strategy, client discards the token.
      // This is the clean stateless API logout implementation.
      return res.status(200).json({ status: 'ok', message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  };
}
