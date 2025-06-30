// pages/api/users.js
import { getToken } from 'next-auth/jwt';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  // Patikrinam prisijungimą naudojant JWT tokeną
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return res.status(401).json({ error: 'Neautorizuota' });
  }

  const email = token.email;

  // GET – paima prisijungusio vartotojo duomenis
  if (req.method === 'GET') {
    try {
      const result = await query(
        `SELECT id, name, email, goal, phone, "dateOfBirth", city, created_at
         FROM users
         WHERE email = $1
         LIMIT 1;`,
        [email]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vartotojas nerastas' });
      }
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('TIKROJI KLAIDA:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // PUT – atnaujina pateiktus laukus
  else if (req.method === 'PUT') {
    try {
      const { name, goal, phone, dateOfBirth, city } = req.body;

      const fields = [];
      const values = [];
      let idx = 1;

      if (name !== undefined)         { fields.push(`name = $${idx++}`); values.push(name); }
      if (goal !== undefined)         { fields.push(`goal = $${idx++}`); values.push(goal); }
      if (phone !== undefined)        { fields.push(`phone = $${idx++}`); values.push(phone); }
      if (dateOfBirth !== undefined)  { fields.push(`"dateOfBirth" = $${idx++}`); values.push(dateOfBirth); }
      if (city !== undefined)         { fields.push(`city = $${idx++}`); values.push(city); }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'Nėra ką atnaujinti' });
      }

      values.push(email); // WHERE pagal email
      const updateRes = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE email = $${idx} RETURNING *;`,
        values
      );

      res.status(200).json(updateRes.rows[0]);
    } catch (error) {
      console.error('ATNAUJINIMO KLAIDA:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // Jei metodas neleistinas
  else {
    res.status(405).json({ error: 'Metodas neleidžiamas' });
  }
}
