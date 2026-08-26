import { env } from '../../config/env';

export interface AIVariation {
  hook: string;
  body: string;
  hashtags: string[];
  fullText: string;
}

export interface AICopilotProvider {
  generateVariations(systemInstruction: string, appInstruction: string, userPrompt: string): Promise<AIVariation[]>;
}

export class MockAIProvider implements AICopilotProvider {
  async generateVariations(_systemInstruction: string, _appInstruction: string, userPrompt: string): Promise<AIVariation[]> {
    await new Promise(r => setTimeout(r, 200));
    return [
      {
        hook: 'Mock Hook: ' + userPrompt.substring(0, 30),
        body: 'Mock body text. Development mode only.',
        hashtags: ['#mock1', '#mock2'],
        fullText: 'Mock Hook\n\nMock body text. Development mode only.\n\n#mock1 #mock2'
      }
    ];
  }
}

export class GeminiProvider implements AICopilotProvider {
  private static readonly TIMEOUT_MS = 20000;

  async generateVariations(systemInstruction: string, appInstruction: string, userPrompt: string): Promise<AIVariation[]> {
    if (!env.GEMINI_API_KEY) {
      throw { status: 500, message: 'AI provider is not configured' };
    }

    // Structured output schema instruction — placed in system instruction, not user content
    const fullSystemInstruction = [
      systemInstruction,
      appInstruction,
      'You MUST return ONLY a valid JSON object matching this exact schema, with no markdown or prose:',
      '{ "variations": [ { "hook": "string", "body": "string", "hashtags": ["string"], "fullText": "string" } ] }',
      'Return exactly 3 variations.'
    ].join('\n\n');

    // User content is structurally separated from system instructions using the Gemini API
    // systemInstruction field is processed separately from user contents[] — this prevents
    // user input from overriding system instructions.
    const requestBody = {
      system_instruction: {
        parts: [{ text: fullSystemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: 'application/json',
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    let res: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GeminiProvider.TIMEOUT_MS);
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        throw { status: 503, message: 'AI provider request timed out' };
      }
      throw { status: 503, message: 'Upstream AI provider network error' };
    }

    if (res.status === 401 || res.status === 403) {
      throw { status: 500, message: 'Provider authorization error' };
    }
    if (res.status === 429) {
      throw { status: 429, message: 'Provider rate limit exceeded' };
    }
    if (!res.ok) {
      throw { status: 502, message: 'Temporary upstream error from AI provider' };
    }

    const data = await res.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw { status: 502, message: 'Empty generation from AI provider' };
    }

    const jsonText = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!jsonText) {
      throw { status: 502, message: 'Upstream format error (empty content)' };
    }

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.variations || !Array.isArray(parsed.variations) || parsed.variations.length === 0) {
        throw new Error('invalid schema');
      }
      return parsed.variations as AIVariation[];
    } catch {
      throw { status: 502, message: 'Upstream format error (malformed response)' };
    }
  }
}
