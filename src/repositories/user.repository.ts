import { pool } from '../config/db';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository {
  async createUser(email: string, passwordHash: string, displayName: string): Promise<User> {
    const query = `
      INSERT INTO users (id, username, email, password_hash, display_name)
      VALUES (gen_random_uuid(), $1, $1, $2, $3)
      RETURNING id, email, password_hash, display_name, created_at, updated_at
    `;
    const values = [email.toLowerCase().trim(), passwordHash, displayName];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email.toLowerCase().trim()]);
    return rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}
