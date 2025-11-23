import path from 'node:path';
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
  databaseFile:
    process.env.DATABASE_FILE ?? path.resolve(process.cwd(), 'data/database.sqlite')
};
