import { Pool } from 'pg';
import { env } from '../config/env';
import { runMigrations } from '../infra/database/migrations';

const pool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password
});

const main = async () => {
  const client = await pool.connect();
  try {
    await runMigrations(client);
    console.log('Migrations executadas com sucesso.');
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error('Erro ao executar migrations:', err);
  process.exit(1);
});
