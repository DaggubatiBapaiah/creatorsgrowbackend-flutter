import { pool } from '../config/db';

export interface BrandDeal {
  id: string;
  user_id: string;
  brand_name: string;
  deal_value: number;
  stage: 'pitching' | 'negotiating' | 'signed' | 'completed' | 'paid';
  contact_person: string | null;
  contact_email: string | null;
  notes: string | null;
  associated_post_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class CrmRepository {
  async createDeal(
    userId: string,
    brandName: string,
    dealValue: number = 0.00,
    stage: 'pitching' | 'negotiating' | 'signed' | 'completed' | 'paid' = 'pitching',
    contactPerson: string | null = null,
    contactEmail: string | null = null,
    notes: string | null = null,
    associatedPostId: string | null = null
  ): Promise<BrandDeal> {
    const query = `
      INSERT INTO brand_deals (
        user_id, brand_name, deal_value, stage, contact_person, contact_email, notes, associated_post_id, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      userId, brandName, dealValue, stage, contactPerson, contactEmail, notes, associatedPostId
    ]);
    return rows[0];
  }

  async updateDeal(
    id: string,
    userId: string,
    updates: Partial<Omit<BrandDeal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<BrandDeal | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let valIndex = 1;

    const allowedKeys = ['brand_name', 'deal_value', 'stage', 'contact_person', 'contact_email', 'notes', 'associated_post_id'];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowedKeys.includes(key)) {
        setClause.push(`${key} = $${valIndex}`);
        values.push(value);
        valIndex++;
      }
    });

    if (setClause.length === 0) {
      return this.getDealById(id, userId);
    }

    // Add updated_at
    setClause.push(`updated_at = NOW()`);

    const query = `
      UPDATE brand_deals
      SET ${setClause.join(', ')}
      WHERE id = $${valIndex} AND user_id = $${valIndex + 1}
      RETURNING *
    `;
    values.push(id, userId);

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }

  async getDealsByUser(userId: string): Promise<BrandDeal[]> {
    const query = `SELECT * FROM brand_deals WHERE user_id = $1 ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async getDealById(id: string, userId: string): Promise<BrandDeal | null> {
    const query = `SELECT * FROM brand_deals WHERE id = $1 AND user_id = $2`;
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0] || null;
  }

  async deleteDeal(id: string, userId: string): Promise<boolean> {
    const query = `DELETE FROM brand_deals WHERE id = $1 AND user_id = $2`;
    const { rowCount } = await pool.query(query, [id, userId]);
    return (rowCount ?? 0) > 0;
  }
}
