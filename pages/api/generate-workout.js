import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  console.log("API called: /api/generate-workout | Method:", req.method);

  if (req.method !== "POST") {
    console.log("Netinkamas metodas:", req.method);
    return res.status(405).end();
  }

  // 1. Tikrinam sesiją
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    console.log("Sesija nerasta arba user neautorizuotas");
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("User email (iš sesijos):", session.user.email);

  // 2. Gaunam user duomenis iš bazės
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    console.log("User NOT FOUND pagal email:", session.user.email);
    return res.status(404).json({ error: "User not found" });
  }
  console.log("User surastas! ID:", user.id);

  // 3. Paruošiam duomenis AI (galima papildyti laukus)
  const userData = {
    name: user.name,
    gender: user.gender,
    age: user.dateOfBirth,
    fitnessLevel: user.fitnessLevel,
    goal: user.goal,
    // Pridėk kitų laukų, jei reikia
  };
  console.log("Paruošti duomenys AI:", userData);

  // 4. Kuriam promptą AI
  const aiPrompt = `
Sukurk sporto planą šiam žmogui pagal duomenis:
${JSON.stringify(userData, null, 2)}
Pateik aiškų, struktūruotą, savaitinį treniruočių planą pradedančiajam, su dienų pavadinimais ir pratimais.
`;
  console.log("Promptas AI:", aiPrompt);

  // 5. Siunčiam į ChatGPT API (OpenAI)
  let aiResponse;
  try {
    aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
  } catch (error) {
    console.log("Klaida jungiantis prie OpenAI:", error);
    return res.status(500).json({ error: "AI connection error", details: String(error) });
  }

  if (!aiResponse.ok) {
    const err = await aiResponse.text();
    console.log("AI error:", err);
    return res.status(500).json({ error: "AI error", details: err });
  }

  const aiData = await aiResponse.json();
  console.log("Gautas atsakymas iš AI:", aiData);

  const generatedText = aiData.choices?.[0]?.message?.content || "Nėra plano";
  console.log("Sugeneruotas planas:", generatedText);

  // 6. Įrašom į GeneratedPlan
  let newPlan;
  try {
    newPlan = await prisma.generatedPlan.create({
      data: {
        userId: user.id,
        type: "sport",
        planData: { text: generatedText },
      },
    });
  } catch (dbError) {
    console.log("DB įrašymo klaida:", dbError);
    return res.status(500).json({ error: "Database error", details: String(dbError) });
  }

  console.log("Planas įrašytas į duomenų bazę:", newPlan);

  // 7. Grąžinam planą atgal
  res.status(200).json({ plan: newPlan.planData });
}
