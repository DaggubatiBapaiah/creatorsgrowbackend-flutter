import { Request, Response } from 'express';
import { AICopilotService } from '../services/ai/ai.service';
import { EntitlementService } from '../services/billing/entitlement.service';
import { z } from 'zod';

const generateSchema = z.object({
  prompt: z.string().min(3).max(500),
  platform: z.enum(['INSTAGRAM', 'TIKTOK']),
  tone: z.string().optional()
});

const variationSchema = z.object({
  hook: z.string(),
  body: z.string(),
  hashtags: z.array(z.string()),
  fullText: z.string()
});

export class AIController {
  private aiService = new AICopilotService();
  private entitlementService = new EntitlementService();

  generateCaption = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const withinLimit = await this.entitlementService.checkAiLimit(userId);
      if (!withinLimit) {
        res.status(403).json({ error: { message: 'AI generation limit reached for this month. Please upgrade your plan.' } });
        return;
      }

      const validated = generateSchema.parse(req.body);
      const variations = await this.aiService.generateVariations(validated.prompt, validated.platform, validated.tone);
      const validatedOutput = z.array(variationSchema).parse(variations);
      res.json({ data: { variations: validatedOutput } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: { message: 'Invalid prompt parameters or malformed upstream response', details: error.errors } });
        return;
      }
      const status = error.status || 500;
      const message = error.message || 'AI generation failed';
      res.status(status).json({ error: { message } });
    }
  };
}
