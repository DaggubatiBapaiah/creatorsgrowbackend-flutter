import { Request, Response, NextFunction } from 'express';
import { MediaKitRepository } from '../repositories/mediakit.repository';
import { ValidationError } from '../utils/errors';
import { z } from 'zod';

const updateConfigSchema = z.object({
  customBio: z.string().max(1000).nullable().optional(),
  contactEmail: z.string().email().nullable().or(z.literal('')).optional(),
  showInstagram: z.boolean().optional(),
  showTiktok: z.boolean().optional(),
  rates: z.array(z.object({
    service: z.string().min(1),
    rate: z.number().nonnegative()
  })).optional()
});

function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export class MediaKitController {
  private mediaKitRepo = new MediaKitRepository();

  getConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      let config = await this.mediaKitRepo.getConfigByUserId(userId);
      
      // Return defaults if configuration does not exist yet
      if (!config) {
        config = {
          id: '',
          user_id: userId,
          custom_bio: '',
          contact_email: '',
          show_instagram: true,
          show_tiktok: true,
          rates: [],
          views_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        };
      }

      res.json({ data: { config } });
    } catch (error) {
      next(error);
    }
  };

  saveConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validated = updateConfigSchema.parse(req.body);

      const config = await this.mediaKitRepo.createOrUpdateConfig(
        userId,
        validated.customBio ?? null,
        validated.contactEmail || null,
        validated.showInstagram,
        validated.showTiktok,
        validated.rates
      );

      res.json({ data: { config } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Invalid configuration input data', error.errors));
        return;
      }
      next(error);
    }
  };

  renderPublicKit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier } = req.params;
      const data = await this.mediaKitRepo.getPublicKitData(identifier);

      if (!data) {
        res.status(404).send(`
          <html>
            <head>
              <title>Media Kit Not Found - CreatorsGrow</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { background-color: #0f0f17; color: #f3f4f6; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: rgba(255, 255, 255, 0.05); padding: 2.5rem; border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); text-align: center; max-width: 400px; }
                h1 { color: #f43f5e; margin-top: 0; }
                p { color: #9ca3af; margin-bottom: 2rem; }
                a { color: #6366f1; text-decoration: none; font-weight: bold; border: 1px solid #6366f1; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background 0.2s; }
                a:hover { background: #6366f1; color: white; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>404</h1>
                <p>The requested CreatorsGrow Media Kit could not be found. Verify the name or user ID and try again.</p>
                <a href="https://creatorsgrow.com">Go to CreatorsGrow</a>
              </div>
            </body>
          </html>
        `);
        return;
      }

      const { user, platforms, topPosts } = data;

      // Calculate totals
      const totalFollowers = platforms.reduce((acc: number, curr: any) => acc + curr.followers, 0);
      const totalReach = platforms.reduce((acc: number, curr: any) => acc + curr.reach_24h, 0);
      const totalImpressions = platforms.reduce((acc: number, curr: any) => acc + curr.impressions_24h, 0);

      // Render Rates HTML
      const ratesHtml = user.rates && user.rates.length > 0 
        ? user.rates.map((r: any) => `
            <div class="rate-item">
              <span class="rate-service">${escapeHtml(r.service)}</span>
              <span class="rate-value">$${escapeHtml(r.rate)}</span>
            </div>
          `).join('')
        : `<p class="no-data">Rates available upon request.</p>`;

      // Render Platforms HTML
      const platformsHtml = platforms.map((p: any) => `
        <div class="platform-card">
          <div class="platform-header">
            <span class="platform-badge ${p.platform.toLowerCase()}">${p.platform.toUpperCase()}</span>
            <span class="platform-username">@${escapeHtml(p.username)}</span>
          </div>
          <div class="platform-stats">
            <div class="stat-box">
              <span class="stat-num">${escapeHtml(p.followers.toLocaleString())}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">${escapeHtml(p.reach_24h.toLocaleString())}</span>
              <span class="stat-label">24h Reach</span>
            </div>
          </div>
        </div>
      `).join('');

      // Render Top Posts HTML
      const topPostsHtml = topPosts && topPosts.length > 0
        ? topPosts.map((post: any) => {
            const formattedEngagement = (parseFloat(post.engagement_rate) * 100).toFixed(2);
            return `
              <div class="post-card">
                <div class="post-badge-container">
                  <span class="post-platform-badge ${post.platform.toLowerCase()}">${post.platform}</span>
                  <span class="post-date">${new Date(post.published_at).toLocaleDateString()}</span>
                </div>
                <p class="post-caption">${escapeHtml(post.caption || 'No caption')}</p>
                <div class="post-metrics">
                  <div class="post-metric">
                    <span class="metric-val">${escapeHtml(post.likes.toLocaleString())}</span>
                    <span class="metric-lbl">Likes</span>
                  </div>
                  <div class="post-metric">
                    <span class="metric-val">${escapeHtml(post.comments.toLocaleString())}</span>
                    <span class="metric-lbl">Comments</span>
                  </div>
                  <div class="post-metric accent">
                    <span class="metric-val">${escapeHtml(formattedEngagement)}%</span>
                    <span class="metric-lbl">Engagement</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')
        : `<p class="no-data">No published posts stats synchronized yet.</p>`;

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${user.display_name} - Platform-Synced Media Kit - CreatorsGrow</title>
          <style>
            :root {
              --bg-color: #0b0c10;
              --surface-color: #1f2833;
              --text-primary: #f3f4f6;
              --text-secondary: #9ca3af;
              --primary: #ec4899;
              --secondary: #6366f1;
              --glass: rgba(255, 255, 255, 0.03);
              --border: rgba(255, 255, 255, 0.08);
            }
            body {
              background-color: var(--bg-color);
              color: var(--text-primary);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              line-height: 1.5;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              padding: 2rem 1rem;
            }
            header {
              text-align: center;
              padding: 3rem 1.5rem;
              background: linear-gradient(135deg, rgba(236,72,153,0.1), rgba(99,102,241,0.1));
              border-radius: 1.5rem;
              border: 1px solid var(--border);
              margin-bottom: 2rem;
              box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(10px);
            }
            .avatar-placeholder {
              width: 90px;
              height: 90px;
              background: linear-gradient(45deg, var(--primary), var(--secondary));
              border-radius: 50%;
              margin: 0 auto 1rem;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2rem;
              font-weight: bold;
              box-shadow: 0 0 20px rgba(236,72,153,0.4);
            }
            h1 {
              margin: 0 0 0.5rem;
              font-size: 2.25rem;
              font-weight: 800;
              background: linear-gradient(to right, #ffffff, #e2e8f0);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .badge-verified {
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;
              background: rgba(99, 102, 241, 0.2);
              border: 1px solid var(--secondary);
              color: #a5b4fc;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 600;
              margin-bottom: 1rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .bio {
              color: var(--text-secondary);
              max-width: 600px;
              margin: 0 auto 1.5rem;
              font-size: 1rem;
            }
            .btn-contact {
              display: inline-flex;
              align-items: center;
              background: var(--primary);
              color: white;
              text-decoration: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.75rem;
              font-weight: 600;
              font-size: 0.875rem;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .btn-contact:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 15px -3px rgba(236, 72, 153, 0.3);
            }
            
            /* Overview stats */
            .overview-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
              margin-bottom: 2rem;
            }
            .overview-card {
              background: var(--glass);
              border: 1px solid var(--border);
              border-radius: 1rem;
              padding: 1.5rem;
              text-align: center;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .overview-num {
              display: block;
              font-size: 2rem;
              font-weight: 800;
              color: var(--text-primary);
              margin-bottom: 0.25rem;
            }
            .overview-label {
              font-size: 0.75rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: var(--text-secondary);
              font-weight: 600;
            }

            .section-title {
              font-size: 1.25rem;
              font-weight: 700;
              margin-bottom: 1rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              border-bottom: 1px solid var(--border);
              padding-bottom: 0.5rem;
              color: #f3f4f6;
            }
            
            /* Platforms */
            .platforms-section {
              margin-bottom: 2.5rem;
            }
            .platforms-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
              gap: 1.25rem;
            }
            .platform-card {
              background: var(--glass);
              border: 1px solid var(--border);
              border-radius: 1rem;
              padding: 1.5rem;
              transition: border-color 0.2s;
            }
            .platform-card:hover {
              border-color: rgba(99, 102, 241, 0.4);
            }
            .platform-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 1.25rem;
            }
            .platform-badge {
              font-size: 0.75rem;
              font-weight: 700;
              padding: 0.25rem 0.5rem;
              border-radius: 0.375rem;
              letter-spacing: 0.05em;
            }
            .platform-badge.instagram {
              background-color: rgba(225, 48, 108, 0.2);
              color: #ff8da1;
              border: 1px solid rgba(225, 48, 108, 0.3);
            }
            .platform-badge.tiktok {
              background-color: rgba(0, 0, 0, 0.4);
              color: #00f2fe;
              border: 1px solid rgba(0, 242, 254, 0.3);
            }
            .platform-username {
              font-weight: 600;
              font-size: 0.9rem;
              color: var(--text-primary);
            }
            .platform-stats {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
            }
            .stat-box {
              background: rgba(255, 255, 255, 0.02);
              padding: 0.75rem;
              border-radius: 0.5rem;
              border: 1px solid rgba(255, 255, 255, 0.04);
            }
            .stat-num {
              display: block;
              font-size: 1.25rem;
              font-weight: 700;
              margin-bottom: 0.125rem;
            }
            .stat-label {
              font-size: 0.7rem;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.02em;
            }

            /* Rates */
            .rates-section {
              margin-bottom: 2.5rem;
            }
            .rates-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
              gap: 1rem;
            }
            .rate-item {
              background: var(--glass);
              border: 1px solid var(--border);
              border-radius: 0.75rem;
              padding: 1rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .rate-service {
              font-weight: 600;
              font-size: 0.9rem;
            }
            .rate-value {
              font-weight: 800;
              color: var(--primary);
              font-size: 1.1rem;
            }

            /* Top Posts */
            .posts-section {
              margin-bottom: 3rem;
            }
            .posts-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
              gap: 1.25rem;
            }
            .post-card {
              background: var(--glass);
              border: 1px solid var(--border);
              border-radius: 1rem;
              padding: 1.25rem;
              display: flex;
              flex-direction: column;
              height: 220px;
            }
            .post-badge-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.75rem;
            }
            .post-platform-badge {
              font-size: 0.65rem;
              font-weight: 700;
              padding: 0.125rem 0.375rem;
              border-radius: 0.25rem;
              text-transform: uppercase;
            }
            .post-platform-badge.instagram { background: rgba(225, 48, 108, 0.15); color: #ff8da1; }
            .post-platform-badge.tiktok { background: rgba(0, 242, 254, 0.15); color: #00f2fe; }
            .post-date {
              font-size: 0.75rem;
              color: var(--text-secondary);
            }
            .post-caption {
              font-size: 0.875rem;
              color: var(--text-primary);
              margin: 0 0 1rem;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
              flex-grow: 1;
            }
            .post-metrics {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0.5rem;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
              padding-top: 0.75rem;
            }
            .post-metric {
              text-align: center;
            }
            .post-metric.accent .metric-val {
              color: var(--primary);
            }
            .metric-val {
              display: block;
              font-size: 0.9rem;
              font-weight: 700;
            }
            .metric-lbl {
              display: block;
              font-size: 0.65rem;
              color: var(--text-secondary);
              text-transform: uppercase;
            }
            
            .no-data {
              color: var(--text-secondary);
              font-style: italic;
              font-size: 0.9rem;
            }
            
            footer {
              text-align: center;
              padding: 2rem 0;
              font-size: 0.75rem;
              color: var(--text-secondary);
              border-top: 1px solid var(--border);
              margin-top: 2rem;
            }
            footer a {
              color: var(--secondary);
              text-decoration: none;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <div class="avatar-placeholder">${escapeHtml(user.display_name.charAt(0).toUpperCase())}</div>
              <h1>${escapeHtml(user.display_name)}</h1>
              <div class="badge-verified">✓ Platform-Synced Audience</div>
              <p class="bio">${escapeHtml(user.custom_bio || 'Welcome to my official media kit.')}</p>
              ${user.contact_email ? `<a href="mailto:${escapeHtml(user.contact_email)}" class="btn-contact">Contact Me</a>` : ''}
            </header>

            <!-- Overall stats card -->
            <div class="overview-grid">
              <div class="overview-card">
                <span class="overview-num">${escapeHtml(totalFollowers.toLocaleString())}</span>
                <span class="overview-label">Total Reach Base</span>
              </div>
              <div class="overview-card">
                <span class="overview-num">${escapeHtml(totalReach.toLocaleString())}</span>
                <span class="overview-label">24h Audience Reach</span>
              </div>
              <div class="overview-card">
                <span class="overview-num">${escapeHtml(user.views_count.toLocaleString())}</span>
                <span class="overview-label">Kit Page Views</span>
              </div>
            </div>

            <!-- Connected Platforms Stats -->
            <div class="platforms-section">
              <div class="section-title">Connected Channels</div>
              <div class="platforms-grid">
                ${platformsHtml}
              </div>
            </div>

            <!-- Custom Partnership Rates -->
            <div class="rates-section">
              <div class="section-title">Partnership Rates</div>
              <div class="rates-grid">
                ${ratesHtml}
              </div>
            </div>

            <!-- Best Posts Insights -->
            <div class="posts-section">
              <div class="section-title">Top Performing Content</div>
              <div class="posts-grid">
                ${topPostsHtml}
              </div>
            </div>

            <footer>
              <p>Audience stats synced from connected platforms.</p>
              <p>Powered by <a href="https://creatorsgrow.com">CreatorsGrow</a></p>
            </footer>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  };
}
