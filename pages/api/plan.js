import OpenAI from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ error: "Reikia būti prisijungus" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Tik POST" });
  }

  let body = {};
  try {
    body = typeof req.body === "object" && req.body
      ? req.body
      : JSON.parse(await getRawBody(req));
  } catch {
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

    const planText = completion.choices[0].message.content.trim();

    // Išsaugom planą DB
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    await prisma.plan.create({
      data: {
        userId: user.id,
        data: {
          input: { age, gender, fitnessLevel, goal, daysPerWeek },
          plan: planText
        }
      }
    });

    return res.status(200).json({ plan: planText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OpenAI ar DB klaida", details: String(err) });
  }
}

function getRawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}
