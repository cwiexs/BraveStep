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
You are a sports science and exercise psychology expert. The client has completed a Sports Habits Test (scale 1–5). Based on this, generate a clear, structured report for internal use.

Focus on:
- General summary of their sport personality
- Strengths (endurance, strength, flexibility, motivation, preferences)
- Weaknesses or risks (imbalance, low motivation, psychological blocks)
- Suggested training style (home/gym, intensity, duration, type)
- Muscle groups to prioritize

Use ${preferredLanguage || "en"} language. Do not include headers or redundant phrases.

Answers:
${Object.entries(answers).map(([key, val]) => `${key}: ${val}`).join("\n")}
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
          { role: "system", content: "You are a fitness and sport psychology expert." },
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
  console.log("[API] AI sport report:", report);

  try {
    await prisma.sportsHabitsReport.create({
      data: {
        userId: user.id,
        answers,
        aiAnalysis: report,
      },
    });
    console.log("[API] Sporto ataskaita įrašyta į DB.");
  } catch (dbError) {
    console.error("[API] Duomenų bazės klaida:", dbError);
    return res.status(500).json({ error: "Database error", details: String(dbError) });
  }

  res.status(200).json({ report, date: new Date().toISOString() });
  console.log("[API] Viskas pavyko, atsakymas išsiųstas frontendui.");
}
