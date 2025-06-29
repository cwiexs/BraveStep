// pages/api/auth/signup.js
import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// IMPORT node-fetch jei dar neturi
import fetch from 'node-fetch';

const RECAPTCHA_SECRET = "6LcTx3ErAAAAAGOaiRszWcn2FQQJo3kSVsNoioqv";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'methodNotAllowed' });
  }

  const { email, password, recaptchaToken } = req.body;
  if (!email || !password || !recaptchaToken) {
    return res.status(400).json({ error: 'missingEmailOrPassword' });
  }

  // 1. Tikrinam reCAPTCHA
  try {
    const captchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET}&response=${recaptchaToken}`
    });
    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      return res.status(403).json({ error: 'recaptchaFailed' });
    }
  } catch (captchaError) {
    return res.status(500).json({ error: 'recaptchaFailed' });
  }

  // 2. Toliau tavo registracijos logika
  try {
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await query(
      'INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)',
      [id, email.split('@')[0], email, hashed]
    );
    return res.status(201).json({ success: true, id });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'userExists' });
    }
    console.error(error);
    return res.status(500).json({ error: 'serverError' });
  }
}
