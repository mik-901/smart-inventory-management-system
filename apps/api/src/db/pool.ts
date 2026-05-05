import pg, { type QueryResultRow } from "pg";

import { env } from "../config/env.js";

export const pool = env.DATABASE_URL
  ? new pg.Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined
    })
  : null;

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured. The API is running in demo-store mode.");
  }

  const result = await pool.query<T>(text, params);
  return result.rows;
}
