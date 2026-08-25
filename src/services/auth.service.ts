import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRepository, User } from '../repositories/user.repository';
import { ConflictError, ValidationError, UnauthorizedError } from '../utils/errors';

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export class AuthService {
  private userRepository = new UserRepository();

  async register(email: string, password: string, displayName: string): Promise<AuthSession> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.userRepository.createUser(email, passwordHash, displayName);
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    };
  }

  async getCurrentUser(id: string): Promise<{ id: string; email: string; displayName: string }> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UnauthorizedError('User session not found.');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { email: user.email },
      env.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
      }
    );
  }
}
