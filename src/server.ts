import app from './app';
import { env } from './config/env';

const port = env.PORT;

app.listen(port, () => {
  console.log(`[server]: CreatorsGrow backend listening on port ${port} in ${env.NODE_ENV} mode.`);
});
