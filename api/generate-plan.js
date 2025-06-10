export default async (req, res) => {
  const { age, weight, gender, goals, daysPerWeek } = req.body;

  if (!age || !weight || !gender || !goals || !daysPerWeek) {
    return res.status(400).json({ error: "Trūksta duomenų." });
  }

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

    if (!data.choices || !data.choices[0]) {
      console.error("Nepavyko gauti atsakymo iš OpenAI:", data);
      return res.status(500).json({ error: "OpenAI negrąžino tinkamo atsakymo." });
    }

    res.status(200).json({ plan: data.choices[0].message.content });
  } catch (err) {
    console.error("Klaida generuojant planą:", err);
    res.status(500).json({ error: "Klaida generuojant planą" });
  }
};
