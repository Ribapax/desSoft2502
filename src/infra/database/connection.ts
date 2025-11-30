import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../../config/env';
import { runMigrations } from './migrations';

type QueryParams = any[] | undefined;

class DatabaseConnection {
  private static pool = new Pool({
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password
  });

  private static initialized = false;

  private constructor() {
    // Prevent direct instantiation
  }

  private static async migrate(client: PoolClient) {
    await runMigrations(client);
  }

  private static async ensureInitialized() {
    if (this.initialized) return;
    const client = await this.pool.connect();
    try {
      await this.migrate(client);
      this.initialized = true;
    } finally {
      client.release();
    }
  }

  public static async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: QueryParams
  ): Promise<QueryResult<T>> {
    await this.ensureInitialized();
    return this.pool.query<T>(text, params);
  }
}

export const dbConnection = DatabaseConnection;
