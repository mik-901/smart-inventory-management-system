import pg from 'pg';
import { env } from './apps/api/src/config/env.js';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const user = await pool.query("select id, name, email, role, password_hash, is_active from users where lower(email) = lower($1)", ['admin@demo.com']);
    console.log("User:", user.rows[0]);
    await pool.query("update users set last_login_at = now() where id = $1", [user.rows[0].id]);
    console.log("Update success");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}
run();
