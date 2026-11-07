import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { seedCatalog } from './seed';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    logger.info(`Initializing SQLite database at: ${dbPath}`);
    dbInstance = new DatabaseSync(dbPath);

    // Set busy timeout FIRST so concurrent threads wait rather than immediately throwing 'database is locked'
    dbInstance.exec('PRAGMA busy_timeout = 10000;');
    try {
      dbInstance.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // WAL mode may already be active or locked by peer connection
    }
    dbInstance.exec('PRAGMA foreign_keys = ON;');

    initSchema(dbInstance);
  }
  return dbInstance;
}

export function initSchema(db: DatabaseSync): void {
  let schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    // Check development / source paths
    const devPath = path.resolve(process.cwd(), 'src/db/schema.sql');
    const relativeDevPath = path.resolve(__dirname, '../../src/db/schema.sql');
    if (fs.existsSync(devPath)) {
      schemaPath = devPath;
    } else if (fs.existsSync(relativeDevPath)) {
      schemaPath = relativeDevPath;
    }
  }

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    logger.info(`Database schema applied successfully from: ${schemaPath}`);
    seedCatalog(db);
  } else {
    logger.warn(`Schema file not found at ${schemaPath}, skipping auto-schema.`);
  }
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    logger.info('Database connection closed.');
  }
}
