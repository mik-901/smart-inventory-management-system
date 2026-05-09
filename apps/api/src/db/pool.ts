import pg, { type QueryResultRow } from "pg";

import { env } from "../config/env.js";

const connectionString = env.DATABASE_URL?.replace(/[?&]sslmode=[^&]*/g, "") ?? undefined;

export const pool = connectionString
  ? new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }   // required for Supabase's self-signed cert chain
    })
  : null;

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured. Set apps/api/.env before using the API.");
  }

  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(work: (client: pg.PoolClient) => Promise<T>) {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured. Set apps/api/.env before using the API.");
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

/** Call once at startup to verify the database is reachable. */
export async function testConnection(): Promise<void> {
  if (!pool) {
    console.log("\x1b[33m⚠  DATABASE_URL not set — API routes will return configuration errors.\x1b[0m");
    return;
  }

  try {
    const client = await pool.connect();
    const { rows } = await client.query<{ now: Date }>("SELECT NOW() AS now");
    client.release();

    const host = new URL(env.DATABASE_URL!).hostname;
    console.log(
      `\x1b[32m✔  Database connected successfully!\x1b[0m  host=${host}  server_time=${rows[0].now.toISOString()}`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31m✖  Database connection FAILED: ${message}\x1b[0m`);
  }
}
