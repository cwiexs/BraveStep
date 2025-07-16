import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.error("[API] Netinkamas metodas:", req.method);
    return res.status(405).end();
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    console.error("[API] Nėra sesijos arba vartotojo el. pašto");
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    console.error("[API] Vartotojas nerastas pagal el. paštą:", session.user.email);
    return res.status(404).json({ error: "User not found" });
  }

  const { answers, preferredLanguage } = req.body;

  // Promptas AI
  const prompt = `
You are a nutrition and eating habits expert. Here are a client's Eating Habits Test answers (scale 1-5). Analyze and generate a structured report:
- General summary
- Main strengths
- Weaknesses / risks
- Recommendations for improvement
Use the client's preferred language: ${preferredLanguage || "en"}.
Answers:
${Object.entries(answers).map(([key, val]) => `${key}: ${val}`).join('\n')}
`;

  let aiResponse;
  try {
    console.log("[API] Siunčiamas užklausimas į OpenAI...");
    aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a nutrition and eating habits expert." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    console.log("[API] AI atsakymas gautas, statusas:", aiResponse.status);
  } catch (error) {
    console.error("[API] Klaida jungiantis prie AI:", error);
    return res.status(500).json({ error: "AI connection error", details: String(error) });
  }

  if (!aiResponse.ok) {
    const err = await aiResponse.text();
    console.error("[API] AI grąžino klaidą:", err);
    return res.status(500).json({ error: "AI error", details: err });
  }

  const aiData = await aiResponse.json();
  const report = aiData.choices?.[0]?.message?.content || "No analysis generated.";
  console.log("[API] AI report:", report);

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        eatingHabitsAnalysis: report,
        eatingHabitsAnalysisDate: new Date(),
      },
    });
    console.log("[API] Ataskaita įrašyta į DB.");
  } catch (dbError) {
    console.error("[API] Duomenų bazės klaida:", dbError);
    return res.status(500).json({ error: "Database error", details: String(dbError) });
  }

  res.status(200).json({ report, date: new Date().toISOString() });
  console.log("[API] Viskas pavyko, atsakymas išsiųstas frontendui.");
}
