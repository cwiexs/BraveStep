import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // pakeisk kelią jei tavo nextauth failas kitoje vietoje
import { prisma } from "../../lib/prisma"; // pakeisk jei tavo prisma helperis kitur

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // 1. Tikrinam sesiją
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Gaunam user duomenis iš bazės
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  // 3. Paruošiam duomenis AI (pasirink reikalingus laukus)
  const userData = {
    name: user.name,
    gender: user.gender,
    age: user.dateOfBirth,
    fitnessLevel: user.fitnessLevel,
    goal: user.goal,
    // Pridėk kitų laukų, jei reikia
  };

  // 4. Kuriam promptą AI
  const aiPrompt = `
Sukurk sporto planą šiam žmogui pagal duomenis:
${JSON.stringify(userData, null, 2)}
Pateik aiškų, struktūruotą, savaitinį treniruočių planą pradedančiajam, su dienų pavadinimais ir pratimais.
`;

  // 5. Siunčiam į ChatGPT API (OpenAI)
  const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Esi profesionalus sporto treneris." },
        { role: "user", content: aiPrompt },
      ],
      max_tokens: 700,
      temperature: 0.7,
    }),
  });

  if (!aiResponse.ok) {
    const err = await aiResponse.text();
    return res.status(500).json({ error: "AI error", details: err });
  }

  const aiData = await aiResponse.json();
  const generatedText = aiData.choices?.[0]?.message?.content || "Nėra plano";

  // 6. Įrašom į GeneratedPlan
  const newPlan = await prisma.generatedPlan.create({
    data: {
      userId: user.id,
      type: "sport",
      planData: { text: generatedText },
    },
  });

  // 7. Grąžinam planą atgal
  res.status(200).json({ plan: newPlan.planData });
}
