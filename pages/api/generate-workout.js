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
    preferredLanguage,
    ...userData
  } = user;

  // 4. Kalbos nustatymas
  let languageString = "English";
  if (preferredLanguage?.toLowerCase() === "lt") languageString = "Lithuanian";
  if (preferredLanguage?.toLowerCase() === "ru") languageString = "Russian";

  // 5. Visų laukų aprašymai
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

  // 6. Promptas AI su duomenų validacija ir motyvacija kiekvienai dienai
 const promptParts = [
  `You are a professional fitness coach and data safety validator.`,
  `First, carefully analyze all the provided user information for logic, realism, safety, and appropriateness.`,
  `Completely ignore grammar, spelling, or language mistakes in the provided data, as long as the intended meaning is clear. Infer the user's intent as a human would, even if the wording is imperfect. Do not reject data because of language, grammar, or typing mistakes.`,
  `If any of the data fields or goals are unrealistic, impossible, unsafe, contain bad intentions, or make it impossible to safely create a workout plan, DO NOT create a plan. Instead, return a clear list of which fields are problematic and why they are inappropriate, unsafe, or illogical. Respond ONLY with: "Cannot create plan: [reason(s)]".`,
  `If some important fields are missing (for example, fitness goals, available equipment, or current fitness level), DO NOT reject the request. Instead, generate the best possible workout plan based on the information that is available. Clearly state at the beginning or end of your response which fields are missing, and provide specific recommendations to the user on why filling in those fields would help you create an even more accurate and safe plan in the future.`,
  `If all the provided data is realistic, logical, and safe, proceed to generate a highly personalized and safe workout plan according to the user's information.`,
  `For each field, here is its meaning and value:`
];

  for (const [key, value] of Object.entries(userData)) {
    if (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    )
      continue;
    const desc = descriptions[key] ? `[${descriptions[key]}]` : "";
    promptParts.push(`${key}: ${JSON.stringify(value)} ${desc}`);
  }

  promptParts.push(
    `IMPORTANT INSTRUCTIONS: 
- NEVER generate a workout plan if there are any doubts about the safety, realism, or appropriateness of the input data. 
- ALWAYS give a clear, structured response in ${languageString}. 
- If you generate a workout plan: For EVERY DAY, start with a unique motivational message to encourage starting the workout, and finish with a unique motivational message for the end of the workout. For EVERY EXERCISE, add a short, beginner-friendly description. If any exercise has a complicated name, explain it briefly. The weekly structure must match the client's schedule, available equipment, and goal. If any data is missing, make your best professional assumptions.`
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
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional fitness coach and data safety validator." },
          { role: "user", content: aiPrompt },
        ],
        max_tokens: 1200,
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

  // Jei AI atsako "Cannot create plan:" – plano neišsaugom, grąžinam vartotojui
  if (generatedText.startsWith("Cannot create plan:")) {
    return res.status(400).json({ error: "AI validation failed", details: generatedText });
  }

  // Kitaip – saugom kaip įprasta
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

  res.status(200).json({ plan: newPlan.planData });
}
