// pages/api/users.js
import { getSession } from 'next-auth/react';
import { query } from '../../lib/db';

export default async function handler(req, res) {
  // Tik patikrinti ar vartotojas prisijungęs
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Neautorizuota' });
  }

  const email = session.user.email;

  if (req.method === 'GET') {
    try {
      // Paimam visą info apie prisijungusį vartotoją
      const result = await query(
        `SELECT id, name, email, goal, phone, birthday, city, created_at
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
      console.error(error);
      res.status(500).json({ error: 'DB klaida arba lentelė neegzistuoja' });
    }
  }

  // PUT – atnaujina informaciją
  else if (req.method === 'PUT') {
    try {
      // Gauna laukus, kuriuos siuntė frontas
      const { name, goal, phone, birthday, city } = req.body;
      // Sukuria dinaminį update užklausą pagal gautus laukus
      const fields = [];
      const values = [];
      let idx = 1;
      if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
      if (goal !== undefined) { fields.push(`goal = $${idx++}`); values.push(goal); }
      if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
      if (birthday !== undefined) { fields.push(`birthday = $${idx++}`); values.push(birthday); }
      if (city !== undefined) { fields.push(`city = $${idx++}`); values.push(city); }

      if (fields.length === 0) return res.status(400).json({ error: 'Nėra ką atnaujinti' });

      values.push(email); // paskutinis – pagal email WHERE
      const updateRes = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE email = $${idx} RETURNING *;`,
        values
      );

      res.status(200).json(updateRes.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'DB atnaujinimo klaida' });
    }
  }
  else {
    res.status(405).json({ error: 'Metodas neleidžiamas' });
  }
}
