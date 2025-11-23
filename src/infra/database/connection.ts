import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env';

class DatabaseConnection {
  private static instance: Database.Database;

  private constructor() {
    // Prevent direct instantiation
  }

  public static getInstance(): Database.Database {
    if (!DatabaseConnection.instance) {
      const databaseDir = path.dirname(env.databaseFile);
      fs.mkdirSync(databaseDir, { recursive: true });

      const connection = new Database(env.databaseFile);
      connection.pragma('foreign_keys = ON');
      connection.pragma('journal_mode = WAL');

      DatabaseConnection.runMigrations(connection);
      DatabaseConnection.instance = connection;
    }

    return DatabaseConnection.instance;
  }

  private static runMigrations(connection: Database.Database) {
    const statements = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        capacity INTEGER NOT NULL CHECK (capacity > 0),
        price_per_hour REAL NOT NULL CHECK (price_per_hour >= 0),
        cover_image_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        space_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price REAL NOT NULL CHECK (total_price >= 0),
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        reservation_id TEXT NOT NULL,
        amount REAL NOT NULL CHECK (amount >= 0),
        status TEXT NOT NULL CHECK (status IN ('SIGNAL', 'FULL')),
        paid_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
      );
    `;

    connection.exec(statements);
  }
}

export const dbConnection = DatabaseConnection.getInstance();
