import { Request, Response, NextFunction } from 'express';
import { CrmRepository } from '../repositories/crm.repository';
import { pool } from '../config/db';
import { ValidationError } from '../utils/errors';
import { z } from 'zod';

const createDealSchema = z.object({
  brandName: z.string().min(1).max(255),
  dealValue: z.number().nonnegative().optional(),
  stage: z.enum(['pitching', 'negotiating', 'signed', 'completed', 'paid']).optional(),
  contactPerson: z.string().max(255).nullable().optional(),
  contactEmail: z.string().email().nullable().or(z.literal('')).optional(),
  notes: z.string().nullable().optional(),
  associatedPostId: z.string().uuid().nullable().optional()
});

const updateDealSchema = createDealSchema.partial();

export class CrmController {
  private crmRepo = new CrmRepository();

  createDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validated = createDealSchema.parse(req.body);

      if (validated.associatedPostId) {
        const { rows } = await pool.query(
          'SELECT id FROM content_posts WHERE id = $1 AND user_id = $2',
          [validated.associatedPostId, userId]
        );
        if (rows.length === 0) {
          res.status(400).json({ error: { message: 'Invalid associated post ID (does not exist or not owned by you)' } });
          return;
        }
      }
      
      const deal = await this.crmRepo.createDeal(
        userId,
        validated.brandName,
        validated.dealValue,
        validated.stage,
        validated.contactPerson,
        validated.contactEmail || null,
        validated.notes,
        validated.associatedPostId
      );

      res.status(201).json({ data: { deal } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Invalid deal input data', error.errors));
        return;
      }
      next(error);
    }
  };

  updateDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const validated = updateDealSchema.parse(req.body);

      const existing = await this.crmRepo.getDealById(id, userId);
      if (!existing) {
        res.status(404).json({ error: { message: 'Deal not found' } });
        return;
      }

      if (validated.associatedPostId) {
        const { rows } = await pool.query(
          'SELECT id FROM content_posts WHERE id = $1 AND user_id = $2',
          [validated.associatedPostId, userId]
        );
        if (rows.length === 0) {
          res.status(400).json({ error: { message: 'Invalid associated post ID (does not exist or not owned by you)' } });
          return;
        }
      }

      const updated = await this.crmRepo.updateDeal(id, userId, {
        brand_name: validated.brandName,
        deal_value: validated.dealValue,
        stage: validated.stage,
        contact_person: validated.contactPerson,
        contact_email: validated.contactEmail || null,
        notes: validated.notes,
        associated_post_id: validated.associatedPostId
      });

      res.json({ data: { deal: updated } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Invalid deal update input data', error.errors));
        return;
      }
      next(error);
    }
  };

  getDeals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const deals = await this.crmRepo.getDealsByUser(userId);
      res.json({ data: { deals } });
    } catch (error) {
      next(error);
    }
  };

  getDealById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deal = await this.crmRepo.getDealById(id, userId);
      if (!deal) {
        res.status(404).json({ error: { message: 'Deal not found' } });
        return;
      }

      res.json({ data: { deal } });
    } catch (error) {
      next(error);
    }
  };

  deleteDeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const success = await this.crmRepo.deleteDeal(id, userId);
      if (!success) {
        res.status(404).json({ error: { message: 'Deal not found or not owned by user' } });
        return;
      }

      res.json({ data: { status: 'ok' } });
    } catch (error) {
      next(error);
    }
  };
}
