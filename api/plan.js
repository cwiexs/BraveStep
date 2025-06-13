import { Configuration, OpenAIApi } from 'openai';



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Leidžiamas tik POST' });
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
Kiekvienai dienai nurodyk apšilimą, pagrindinius pratimus ir tempimo pratimus.
Pabaigoje pateik trumpą mitybos rekomendaciją. Atsakyk lietuviškai.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const plan = completion.data.choices[0].message.content.trim();
    res.status(200).json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OpenAI klaida' });
  }
}
