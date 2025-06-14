// pages/api/users.js
import { query } from '../../lib/db';

export default async function handler(req, res) {
  try {
    // Atrenkame svarbiausius laukus
    const result = await query(
      `SELECT id, name, email, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'DB klaida arba lentelė neegzistuoja' });
  }
}
