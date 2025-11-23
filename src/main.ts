import { env } from './config/env';
import { createApp } from './server';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Seu Cantinho API escutando na porta ${env.port}`);
});
