import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  // 1. Autentikacija
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Gauti user iš DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // 3. Atmetam jautrius laukus
  const {
    password,
    email,
    id,
    created_at,
    updated_at,
    ...userData
  } = user;

  // 4. Kalbos nustatymas
  const preferredLanguage = user.preferredLanguage || "en";
  let languageString = "English";
  if (preferredLanguage.toLowerCase() === "lt") languageString = "Lithuanian";
  if (preferredLanguage.toLowerCase() === "ru") languageString = "Russian";
  // galima pridėti daugiau kalbų jei reikia

  // 5. Visų laukų aprašymai (KEY = tavo DB stulpelis, VALUE = AI instrukcija)
  const descriptions = {
    name: "The client's first name for a more personal plan.",
    profilePhotoUrl: "Ignore. This is a profile photo URL, not relevant for workouts.",
    dateOfBirth: "Use to determine the client's age and adapt recommendations for age.",
    gender: "Consider any gender-specific physiological aspects when making recommendations.",
    city: "The client's city, for location-based recommendations or climate.",
    country: "The client's country, for cultural or climate context.",
    address: "May be ignored, unless relevant for logistics.",
    heightCm: "The client's height in centimeters, for BMI and body composition context.",
    weightKg: "The client's weight in kilograms, for BMI and body composition context.",
    bodyType: "The client's body type (ectomorph, mesomorph, endomorph) – adapt exercise and nutrition if relevant.",
    fitnessLevel: "Indicates the client's exercise experience level – adapt difficulty.",
    healthConditions: "Medical conditions or issues that may limit or affect workout options – avoid risky suggestions.",
    allergies: "List of allergies (for nutrition or general health context).",
    foodRestrictions: "Restrictions or diets (vegetarian, vegan, gluten-free, etc.).",
    jobType: "Type of job (sedentary, active, shift) – affects daily activity.",
    workHoursPerDay: "Number of hours worked per day – consider for energy/time budgeting.",
    workSchedule: "Type of work schedule (early, late, shift, etc.) – affects when workouts are feasible.",
    wakeUpTime: "Usual wake-up time – suggest ideal workout timing.",
    bedTime: "Usual bedtime – for optimal recovery and workout timing.",
    sleepHours: "Average sleep duration – adjust training volume accordingly.",
    familyStatus: "Information about family status, if relevant for schedule or motivation.",
    mealsPerDay: "How many meals per day – only use for nutrition context.",
    eatsOutOften: "If the client eats out often – may affect diet planning.",
    favoriteActivities: "Preferred sports or activities – increase motivation by including them if possible.",
    gymMember: "Is the client a gym member? Only assign gym-based workouts if true.",
    physicalActivityLevel: "General physical activity – adapt total training load.",
    stepsPerDay: "Average daily steps – indicates base activity.",
    currentSports: "Sports the client currently practices – consider avoiding overlap or overuse.",
    newActivitiesInterest: "Activities the client is interested in trying.",
    minutesPerWorkout: "Maximum duration of one workout session.",
    workoutsPerWeek: "Target number of workout sessions per week.",
    workoutLocation: "Where the client prefers to work out (home, gym, outdoor, etc.). Only recommend what is possible in this location.",
    equipmentAvailable: "List of available equipment. Recommend ONLY exercises that can be performed with this equipment.",
    dietType: "Preferred diet (if any), e.g., keto, Mediterranean. Only mention for nutrition advice.",
    favoriteFoods: "Foods the client likes – for nutrition context.",
    dislikedFoods: "Foods the client dislikes – for nutrition context.",
    cuisinePreference: "Preferred cuisines – for nutrition context.",
    supplements: "Current supplements taken by the client.",
    eatingHabits: "Any special eating habits (snacking, intermittent fasting, etc.).",
    coffeePerDay: "Average daily coffee intake.",
    teaPerDay: "Average daily tea intake.",
    sugarPerDay: "Average daily sugar intake.",
    motivationLevel: "Motivation level – if low, recommend more accessible or shorter workouts.",
    mainObstacles: "Main obstacles the client faces (time, energy, access, etc.) – try to address these.",
    notifications: "Ignore – platform feature.",
    successDefinition: "How the client defines 'success' – personalize plan accordingly.",
    previousFitnessExperience: "Previous training experience – for context and preventing overtraining.",
    planUpdateFrequency: "How often the plan should be updated (weekly, monthly, etc.).",
    hasInsurance: "Ignore for training purposes.",
    smokes: "Does the client smoke? Consider when setting cardio intensity.",
    alcohol: "Alcohol consumption – for general health context.",
    stressLevel: "Current stress level – adjust training volume if high.",
    medications: "List of medications – watch out for drug-exercise interactions.",
    smartWatch: "Ignore unless relevant for tracking.",
    goal: "Main fitness goal – the workout plan must focus on this.",
    goalDeadline: "Target deadline to reach the goal.",
    wantsRestRecommendations: "Should include rest and recovery advice.",
    accessLevel: "Ignore.",
    additionalNotes: "Any other relevant info – consider if possible.",
    preferredContactTime: "Ignore unless plan timing should fit.",
    referralSource: "Ignore.",
  };

  // 6. Promptas AI: kiekvienas laukas su paaiškinimu ir verte
  const promptParts = [
    `You are a professional fitness coach. Below is the client's personal data. For each field, use the description to understand its relevance. Analyze everything and create a safe, highly personalized and realistic workout plan.`,
  ];

  for (const [key, value] of Object.entries(userData)) {
    if (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    )
      continue;
    // Jei yra AI aprašymas, pridedam jį, jei ne – tik pavadinimą
    const desc = descriptions[key]
      ? `[${descriptions[key]}]`
      : "";
    promptParts.push(
      `${key}: ${JSON.stringify(value)} ${desc}`
    );
  }

  promptParts.push(
    `IMPORTANT: Write the plan in ${languageString}. For EVERY exercise, include a short and clear description that even a beginner would understand. Explain any exercise with a complicated name. The weekly structure must match the client's schedule, available equipment and goal. If information is missing, make your best professional assumptions.`
  );

  const aiPrompt = promptParts.join("\n\n");

  // 7. Siunčiam į OpenAI
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
          { role: "system", content: "You are a professional fitness coach." },
          { role: "user", content: aiPrompt },
        ],
        max_tokens: 900,
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

  const generatedText = aiData.choices?.[0]?.message?.content || "No plan generated.";

  // 8. Įrašom į DB
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
    return res.status(500).json({ error: "Database error", details: String(dbError) });
  }

  // 9. Grąžinam klientui
  res.status(200).json({ plan: newPlan.planData });
}
