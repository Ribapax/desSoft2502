import { env } from './config/env';
import { createApp } from './server';
import { runSeed } from './scripts/seed';

const app = createApp();

app.listen(env.port, async () => {
  console.log(`Seu Cantinho API escutando na porta ${env.port}`);
  
  // Run seed to ensure demo data exists
  try {
    await runSeed();
  } catch (error) {
    console.error('Erro ao executar seed:', error);
  }
});
