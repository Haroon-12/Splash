import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const isTursoEnabled = process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN;

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