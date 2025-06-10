
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { age, weight, gender, goals, daysPerWeek } = req.body;

  const prompt = `Create a personalized weekly workout plan for a ${age}-year-old ${gender}, weighing ${weight}kg, who wants to ${goals} and plans to train ${daysPerWeek} times per week. Respond in short bullet points with day-by-day structure.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    res.status(200).json({ plan: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "Klaida generuojant planą" });
  }
}
