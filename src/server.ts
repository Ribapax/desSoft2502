import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import routes from './app/routes';
import { errorHandler } from './app/middlewares/error-handler';
import { env } from './config/env';
import './infra/database/connection';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(helmet());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  const openApiPath = path.resolve(process.cwd(), 'openapi.yaml');
  if (fs.existsSync(openApiPath)) {
    const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf-8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  } else {
    console.warn('OpenAPI document não encontrado em', openApiPath);
  }

  app.use('/api', routes);
  app.use(errorHandler);

  return app;
};
