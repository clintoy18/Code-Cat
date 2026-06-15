import { env } from '@/config/env';
import { app } from './app';

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Code Cat API listening on port ${env.PORT}`);
});
