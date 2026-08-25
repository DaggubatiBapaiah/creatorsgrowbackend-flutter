import app from './app';
import { env } from './config/env';
import { startJobQueue } from './workers/job_queue';

const port = env.PORT;

app.listen(port, () => {
  console.log(`[server]: CreatorsGrow backend listening on port ${port} in ${env.NODE_ENV} mode.`);
  
  // Start the background worker queue
  startJobQueue().catch(err => {
    console.error('Failed to start job queue:', err);
  });
});
