import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().optional().default('postgres://mock:mock@localhost:5432/mock'),
  JWT_SECRET: z.string().min(8).optional().default('mocksecret123456789'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('*'),
  META_OAUTH_MODE: z.enum(['real', 'mock']).default('mock'),
  META_APP_ID: z.string().optional().default('mock-meta-app-id'),
  META_APP_SECRET: z.string().optional().default('mock-meta-app-secret'),
  META_REDIRECT_URI: z.string().url().optional().default('https://creatorsgrowbackend-flutter.vercel.app/api/v1/auth/meta/callback'),
  META_CONFIG_ID: z.string().optional().default('mock-meta-config-id'),
  INSTAGRAM_APP_ID: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  TIKTOK_OAUTH_MODE: z.enum(['real', 'mock']).default('mock'),
  TIKTOK_CLIENT_KEY: z.string().default('mock'),
  TIKTOK_CLIENT_SECRET: z.string().default('mock'),
  TIKTOK_REDIRECT_URI: z.string().url().default('http://localhost:3000/api/v1/social/tiktok/callback'),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters').optional().default('12345678901234567890123456789012'),
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
