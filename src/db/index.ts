import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@/db/schema';

// Support both local SQLite and remote Turso (LibSQL)
const isTursoEnabled = process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN;

console.log("Runtime DB Check:", {
  hasUrl: !!process.env.TURSO_CONNECTION_URL,
  hasToken: !!process.env.TURSO_AUTH_TOKEN,
  isTurso: isTursoEnabled
});
function getDb() {
  if (isTursoEnabled) {
    console.log("Initializing Turso Database connection...");
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
    return drizzle(client, { schema });
  } else {
    console.log("Initializing local SQLite Database (local.db)...");
    const sqlite = new Database('local.db');
    return drizzleSqlite(sqlite, { schema });
  }
}

export const db = getDb() as unknown as LibSQLDatabase<typeof schema>;
export type Database = typeof db;