import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
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
Use the client's preferred language: ${preferredLanguage}.
Answers:
${Object.entries(answers).map(([key, val]) => `${key}: ${val}`).join('\n')}
`;

  let aiResponse;
  try {
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
  } catch (error) {
    return res.status(500).json({ error: "AI connection error", details: String(error) });
  }

  if (!aiResponse.ok) {
    const err = await aiResponse.text();
    return res.status(500).json({ error: "AI error", details: err });
  }

  const aiData = await aiResponse.json();
  const report = aiData.choices?.[0]?.message?.content || "No analysis generated.";

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        eatingHabitsAnalysis: report,
        eatingHabitsAnalysisDate: new Date(), // <-- nauja eilutė
      },
    });
  } catch (dbError) {
    return res.status(500).json({ error: "Database error", details: String(dbError) });
  }

  res.status(200).json({ report, date: new Date().toISOString() }); 
}
