import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@/db/schema';

// Support both local SQLite and remote Turso (LibSQL)
const isTursoEnabled = process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN;

function getDb() {
  if (isTursoEnabled) {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    return drizzle(client, { schema });
  } else {
    const sqlite = new Database('local.db');
    return drizzleSqlite(sqlite, { schema });
  }
}

export const db = getDb();
export type Database = typeof db;