import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const isTursoEnabled = process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN;

console.log("DB Initialization Status:", {
  hasUrl: !!process.env.TURSO_CONNECTION_URL,
  hasToken: !!process.env.TURSO_AUTH_TOKEN,
  isTursoEnabled,
  nodeEnv: process.env.NODE_ENV
});

if (!isTursoEnabled && process.env.NODE_ENV === "production") {
  console.error("CRITICAL: Turso environment variables are missing in production!");
}

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isTursoEnabled ? 'turso' : 'sqlite',
  dbCredentials: {
    url: isTursoEnabled ? process.env.TURSO_CONNECTION_URL! : './local.db',
    authToken: isTursoEnabled ? process.env.TURSO_AUTH_TOKEN : undefined,
  },
});

export default dbConfig;