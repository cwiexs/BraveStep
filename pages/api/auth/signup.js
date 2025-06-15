// pages/api/auth/signup.js
import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const id = uuidv4();
  await query(
    'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)',
    [id, email.split('@')[0], email, hashed]
  );
  res.status(201).json({ id });
}
