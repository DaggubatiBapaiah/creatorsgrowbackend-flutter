import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRouter from './routes/auth.routes';
import healthRouter from './routes/health.routes';
import socialRouter from './routes/social.routes';
import { contentRouter } from './routes/content.routes';
import { mediaRouter } from './routes/media.routes';
import analyticsRouter from './routes/analytics.routes';
import growthRouter from './routes/growth.routes';
import aiRouter from './routes/ai.routes';
import crmRouter from './routes/crm.routes';
import mediaKitRouter from './routes/mediakit.routes';
import billingRouter from './routes/billing.routes';
import inboxRouter from './routes/inbox.routes';
import notificationRouter from './routes/notification.routes';
import legalRouter from './routes/legal.routes';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

app.use('/', legalRouter);
app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/social', socialRouter);
app.use('/api/v1/content', contentRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/growth', growthRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/crm', crmRouter);
app.use('/api/v1/media-kit', mediaKitRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/inbox', inboxRouter);
app.use('/api/v1/notifications', notificationRouter);

const uploadsPath = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/.well-known/assetlinks.json', (req, res) => {
  res.json([{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.creators_grow",
      "sha256_cert_fingerprints": [
        "7B:9E:24:18:28:52:53:01:71:EB:7D:01:FF:17:19:2A:95:C9:1D:21:84:F3:D5:78:D7:DC:2A:62:5A:ED:D1:01"
      ]
    }
  }]);
});

app.get('/oauth/callback', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>CreatorsGrow Connect</title>
      </head>
      <body style="display:flex; justify-content:center; align-items:center; height:100vh; background-color:#0F172A; color:white; font-family:sans-serif; text-align:center;">
        <div>
          <h2>Connection Successful</h2>
          <p style="color:#94A3B8;">You can now close this window and return to the app.</p>
          <a href="creatorsgrow://oauth/callback?status=success" style="display:inline-block; margin-top:20px; padding:12px 24px; background-color:#6366F1; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">Return to App</a>
        </div>
      </body>
    </html>
  `);
});

app.use(errorHandler);

export default app;
