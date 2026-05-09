import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runSqlFile(filePath: string) {
  if (!pool) throw new Error("DATABASE_URL is not configured.");
  const sql = await readFile(filePath, "utf8");
  await pool.query(sql);
}

export async function migrate() {
  await runSqlFile(resolve(__dirname, "../../../../database/schema.sql"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await migrate();
  await pool?.end();
}
