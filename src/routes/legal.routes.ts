import { Router, Request, Response } from 'express';

const legalRouter = Router();

legalRouter.get('/privacy-policy', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - CreatorsGrow</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
        h1, h2 { color: #111; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p>Last updated: August 30, 2026</p>
      
      <h2>1. Introduction</h2>
      <p>CreatorsGrow is a social media management platform designed to help creators streamline their workflow. This Privacy Policy explains how we collect, use, and protect your information.</p>
      
      <h2>2. Social Media Accounts</h2>
      <p>Users can connect their social media accounts, such as Facebook and Instagram, to CreatorsGrow to enable our core features.</p>
      
      <h2>3. Information We Access</h2>
      <p>When you connect a social media account, we access basic profile information, account metadata, and content metrics required to provide our services. We do not access passwords or private messages unless explicitly requested for a specific feature you enable.</p>
      
      <h2>4. How We Use Your Data</h2>
      <p>Social media data is used strictly for:</p>
      <ul>
        <li>Scheduling and publishing content to your connected platforms</li>
        <li>Generating analytics and performance insights</li>
        <li>Providing account management features within the CreatorsGrow dashboard</li>
      </ul>
      
      <h2>5. Security of Access Tokens</h2>
      <p>Access tokens granted by social media platforms are stored securely using industry-standard encryption. They are used exclusively by our backend systems to perform actions on your behalf and provide the functionality you request.</p>
      
      <h2>6. Disconnecting Accounts</h2>
      <p>You maintain full control over your connected accounts. You can disconnect or remove any connected social account at any time from your CreatorsGrow dashboard, which will immediately revoke our access to that platform and delete the associated tokens from our active systems.</p>
      
      <h2>7. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact our privacy team at privacy@creatorsgrow.com.</p>
    </body>
    </html>
  `);
});

legalRouter.get('/data-deletion', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>User Data Deletion - CreatorsGrow</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
        h1, h2 { color: #111; }
      </style>
    </head>
    <body>
      <h1>User Data Deletion Policy</h1>
      
      <h2>Requesting Account Deletion</h2>
      <p>As a CreatorsGrow user, you have the right to request the complete deletion of your account and all associated social-media data from our systems.</p>
      
      <h2>How to Request Deletion</h2>
      <p>To request data deletion, you can either:</p>
      <ol>
        <li>Log into your CreatorsGrow dashboard, navigate to <strong>Settings &gt; Account</strong>, and click <strong>Delete Account</strong>.</li>
        <li>Send an email to <strong>privacy@creatorsgrow.com</strong> with the subject "Data Deletion Request" from the email address associated with your account.</li>
      </ol>
      
      <h2>What Happens When You Request Deletion?</h2>
      <p>Upon receiving a deletion request, we will:</p>
      <ul>
        <li>Permanently delete your user profile and login credentials.</li>
        <li>Remove all encrypted social media access tokens.</li>
        <li>Delete all cached analytics, scheduled posts, and connected social media data stored in our database.</li>
      </ul>
      <p>This process is irreversible. Please allow up to 30 days for data to be completely purged from all our backups.</p>
      
      <h2>Contact</h2>
      <p>For any issues regarding data deletion, please reach out to us at privacy@creatorsgrow.com.</p>
    </body>
    </html>
  `);
});

export default legalRouter;
