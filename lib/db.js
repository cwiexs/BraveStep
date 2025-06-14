// lib/db.js
import createPool from '@neondatabase/serverless';  // <- default import

// Pool naudojamas tiek adapteriui, tiek tavo API
export const pool = createPool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
