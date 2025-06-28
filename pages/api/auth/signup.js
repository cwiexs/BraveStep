// pages/api/auth/signup.js
import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'methodNotAllowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'missingEmailOrPassword' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await query(
      'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)',
      [id, email.split('@')[0], email, hashed]
    );
    return res.status(201).json({ success: true, id });
  } catch (error) {
    // Jeigu el. paštas jau egzistuoja
    if (error.code === '23505') {
      return res.status(409).json({ error: 'userExists' });
    }
    // Kitos klaidos
    console.error(error);
    return res.status(500).json({ error: 'serverError' });
  }
}
