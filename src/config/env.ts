import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('*'),
  META_OAUTH_MODE: z.enum(['real', 'mock']).default('mock'),
  META_APP_ID: z.string(),
  META_APP_SECRET: z.string(),
  META_REDIRECT_URI: z.string().url(),
  META_CONFIG_ID: z.string(),
  INSTAGRAM_APP_ID: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  TIKTOK_OAUTH_MODE: z.enum(['real', 'mock']).default('mock'),
  TIKTOK_CLIENT_KEY: z.string().default('mock'),
  TIKTOK_CLIENT_SECRET: z.string().default('mock'),
  TIKTOK_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/v1/social/tiktok/callback'),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters'),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_mockkeyid123'),
  RAZORPAY_KEY_SECRET: z.string().default('mocksecret123456789'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mockwebhooksecret123'),
}).refine((data) => {
  if (data.META_OAUTH_MODE === 'real') {
    if (data.META_APP_ID.includes('your-meta') || data.META_APP_SECRET.includes('your-meta')) {
      return false;
    }
  }
  return true;
}, {
  message: "Real Meta OAuth mode requires valid META_APP_ID and META_APP_SECRET, not placeholders.",
  path: ['META_OAUTH_MODE']
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuration validation failed:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Configuration validation failed. Check Vercel environment variables.');
}

export const env = parsed.data;
