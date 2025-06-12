
import { Configuration, OpenAIApi } from 'openai';
import pkg from 'pg';
const { Pool } = pkg;

export const config = { runtime: 'nodejs20.x' };

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Tik POST leidžiamas' });
    return;
  }

  const { age, gender, fitnessLevel, goal, daysPerWeek } = req.body || {};

  if (!age || !goal || !daysPerWeek) {
    res.status(400).json({ error: 'Trūksta laukų' });
    return;
  }

  try {
    const openai = new OpenAIApi(
      new Configuration({ apiKey: process.env.OPENAI_API_KEY })
    );

    const prompt = `
Esi profesionalus sporto treneris. Sukurk ${daysPerWeek}-dienių per savaitę treniruočių planą 
${age}-mečiui ${gender}, fitneso lygis: ${fitnessLevel}, tikslas: ${goal}.
Aprašyk kiekvieną dieną, įtrauk apšilimą, pagrindinius pratimus, tempimus ir mitybos patarimų.
Atsakyk lietuviškai.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const plan = completion.data.choices[0].message.content.trim();

    // Įrašom į DB
    const insert = await pool.query(
      'INSERT INTO plans (input_json, plan_text) VALUES ($1, $2) RETURNING id',
      [req.body, plan]
    );

    const id = insert.rows[0].id;
    res.status(200).json({ id, plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vidinė klaida' });
  }
}
