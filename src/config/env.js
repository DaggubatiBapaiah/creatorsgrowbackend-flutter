"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var dotenv_1 = __importDefault(require("dotenv"));
var zod_1 = require("zod");
dotenv_1.default.config();
var envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(8),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    META_OAUTH_MODE: zod_1.z.enum(['real', 'mock']).default('mock'),
    META_APP_ID: zod_1.z.string(),
    META_APP_SECRET: zod_1.z.string(),
    META_REDIRECT_URI: zod_1.z.string().url(),
    META_CONFIG_ID: zod_1.z.string(),
    INSTAGRAM_APP_ID: zod_1.z.string().optional(),
    INSTAGRAM_APP_SECRET: zod_1.z.string().optional(),
    TIKTOK_OAUTH_MODE: zod_1.z.enum(['real', 'mock']).default('mock'),
    TIKTOK_CLIENT_KEY: zod_1.z.string().default('mock'),
    TIKTOK_CLIENT_SECRET: zod_1.z.string().default('mock'),
    TIKTOK_REDIRECT_URI: zod_1.z.string().url().default('http://localhost:3000/api/v1/social/tiktok/callback'),
    ENCRYPTION_KEY: zod_1.z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters'),
    AI_PROVIDER: zod_1.z.enum(['mock', 'gemini']).default('mock'),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    RAZORPAY_KEY_ID: zod_1.z.string().default('rzp_test_mockkeyid123'),
    RAZORPAY_KEY_SECRET: zod_1.z.string().default('mocksecret123456789'),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().default('mockwebhooksecret123'),
}).refine(function (data) {
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
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Configuration validation failed:', JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}
exports.env = parsed.data;
