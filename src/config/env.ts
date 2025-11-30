import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value: string | undefined): number => {
  const port = Number(value);
  if (Number.isNaN(port) || port <= 0) {
    return 3333;
  }
  return port;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parsePort(process.env.DB_PORT ?? '5432'),
    name: process.env.DB_NAME ?? 'seu_cantinho',
    user: process.env.DB_USER ?? 'seucantinho',
    password: process.env.DB_PASSWORD ?? 'seucantinho'
  }
};
