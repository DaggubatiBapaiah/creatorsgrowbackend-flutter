import { env } from '../../config/env';
import { AICopilotProvider, GeminiProvider, MockAIProvider, AIVariation } from './ai.provider';

export class AICopilotService {
  private provider: AICopilotProvider;

  constructor() {
    if (env.AI_PROVIDER === 'gemini') {
      this.provider = new GeminiProvider();
    } else {
      this.provider = new MockAIProvider();
    }
  }

  async generateVariations(prompt: string, platform: 'INSTAGRAM' | 'TIKTOK', tone: string = 'engaging'): Promise<AIVariation[]> {
    const systemInstruction = `You are an expert social media content creator and growth strategist. You specialize in creating highly engaging, viral hooks and captions.`;
    
    const appInstruction = `Create 3 distinct variations of a social media post for ${platform}. The tone should be ${tone}. 
Ensure each variation has:
1. A strong, attention-grabbing 'hook'.
2. A 'body' that provides value and encourages engagement.
3. Relevant 'hashtags' (3-5 max).
4. 'fullText' which combines the hook, body, and hashtags neatly formatted with line breaks.
Return exactly 3 variations. Avoid emojis if the tone is 'professional'. Do NOT include the user's prompt directly in the system instructions. Focus solely on fulfilling the request.`;

    try {
      return await this.provider.generateVariations(systemInstruction, appInstruction, prompt);
    } catch (error: any) {
      // Map provider failures
      if (error.status) {
        throw error; // Custom mapped error from provider
      }
      throw { status: 500, message: 'AI generation failed due to internal error' };
    }
  }
}
