import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Leidžiamas tik POST" });
  }

  let body = {};
  try {
    body = typeof req.body === "object" && req.body
      ? req.body
      : JSON.parse(await getRawBody(req));
  } catch (err) {
    return res.status(400).json({ error: "Blogas JSON" });
  }

  const { age, gender, fitnessLevel, goal, daysPerWeek } = body;

  if (!age || !goal || !daysPerWeek) {
    return res.status(400).json({ error: "Trūksta laukų" });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Esi profesionalus sporto treneris. Sukurk ${daysPerWeek}-dienių per savaitę treniruočių planą 
${age}-mečiui ${gender}, fitneso lygis: ${fitnessLevel}, tikslas: ${goal}.
Kiekvienai dienai nurodyk apšilimą, pagrindinius pratimus ir tempimo pratimus.
Pabaigoje pateik trumpą mitybos rekomendaciją. Atsakyk lietuviškai.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const plan = completion.choices[0].message.content.trim();
    return res.status(200).json({ plan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OpenAI klaida", details: String(err) });
  }
}

function getRawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}
