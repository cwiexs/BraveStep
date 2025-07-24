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
  ...userData
} = user;

// 4. Konvertuoja weightKg į skaičių, jei buvo tekstas
if (userData.weightKg !== undefined && userData.weightKg !== null) {
  userData.weightKg = Number(String(userData.weightKg).replace(",", "."));
}


  // 5. Visų laukų aprašymai
  const descriptions = {
    name: "The client's first name for a more personal plan.",
    profilePhotoUrl: "Ignore. This is a profile photo URL, not relevant for workouts.",
    dateOfBirth: "Use to determine the client's age and adapt recommendations for age.",
    gender: "Consider any gender-specific physiological aspects when making recommendations.",
    preferredLanguage: "The language in which the user prefers to receive all workout plan instructions, motivational messages, and exercise descriptions. Absolutely all output must be in this language.",
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
    mealsPerDay: "Number of main meals per day – use this value when tailoring nutrition plans or calculating daily energy needs. Can also help adjust training intensity or meal timing strategies in fitness programs.",
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
    alcohol: "Alcohol consumption – for general health assessment. Follow standard classification based on alcohol units per week: Light – up to 4 alcohol units per week (e.g., 1–2 glasses of wine or 1–2 beers); Moderate – between 5 and 14 units per week (e.g., 2–6 drinks, such as wine, beer, or spirits); Heavy – more than 14 units per week or high-volume drinking in a short time. Use UK Chief Medical Officers' guidelines as reference.",
    stressLevel: "Current stress level (1 = very low, 10 = extremely high). The higher the number, the more important it is to reduce training volume and prioritize recovery. If this field is empty, recommend the user to fill it in, as it significantly affects workout intensity and mental balance.",
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
  // 1. Kas esi
  "You are a professional fitness coach, data safety validator, and empathetic psychological guide. Your mission is to generate realistic, personalized, and safe workout plans, while also providing emotionally supportive and psychologically aware motivational messages adapted to the user's mental and emotional needs.",

  // 2. Kalbos nustatymas ir vertimas
  `IMPORTANT: All field values may be provided in different natural languages (e.g., Lithuanian, Polish, French, German, etc.).`,
  `Your first task is to detect and internally translate ALL field values into English before processing them.`,
  `NEVER reject or misinterpret data due to unfamiliar language.`,
  `DO NOT generate responses in English if the user has provided a preferredLanguage – use that language exclusively.`,
  `Ensure that the visible content contains only the user's preferred language. Do not mix words or sentences from different languages.`,
  // 2.1 Kalbos aiškumas ir terminų vartojimas
  `When generating content in the user's preferred language, you MUST use natural and commonly used vocabulary, as found in local fitness guides, government health portals, or official sport websites.`,
  `DO NOT translate fitness terms directly from English word-by-word.`,
  `Examples:
  - Instead of "komplektai", use "serijos" or "kartus".
  - Instead of "darykite apskritimus", say "Sukite pečius ratu" or "Atlikite 10 ratų į vieną pusę, tada į kitą."`,
  `Always try to match the style and terminology used in real fitness programs written by native speakers.`,
  `You may reference stylistic examples from sportuok.lt, sveikata.lt, or other native language fitness sites.`,
  `If unsure, prefer simple, natural and human-sounding expressions over literal translations.`,

  // 3. Duomenų analizė
  `Carefully analyze all the provided user information for logic, realism, safety, and appropriateness.`,
  `Completely ignore grammar, spelling, or language mistakes in the data. Infer the user's intent as a human would.`,

  // 4. Ką daryti su trūkstamais duomenimis
  `If some important fields are missing (e.g., fitness goals, equipment, or fitness level), DO NOT reject the request.`,
  `Generate the best possible workout plan with available info.`,
  `At the end of the plan, list any missing fields under a section called ##MISSING_FIELDS##, and explain why they are important.`,

  // 5. Kada atsisakyti plano
  `Only reject the plan if the data is clearly unrealistic, biologically impossible, or absolutely unsafe (e.g., weight of 1000kg, missing age, or medically dangerous combination).`,
  `Do NOT reject the plan based only on a high stress level, poor sleep, or general concern.`,
  `Instead, if stress or other values are high, adapt the plan and explain it gently to the user, using supportive motivation and calming exercises.`,
  `Only reject the plan if it would be medically irresponsible or physically impossible to suggest any form of physical activity.`,
  `If you cannot generate a plan, ALWAYS return a clear explanation in the same structure the user expects.`,
  `Use this format exactly: %%intro\n[Explanation in user's language why the plan was not created]\n##MISSING_FIELDS##\n[List any missing or unsafe fields in user's language]`,
  `Make sure this explanation is human-readable and supportive. It must never be empty or technical.`,
  `Even if no plan is created, the user must understand why and what they can do next.`,

  // 5.1. Adaptacija ribinėms, bet realioms vertėms
  `HOWEVER, if a value is real but extreme (e.g., stress level 10/10, very high weight, poor sleep), DO NOT reject the request.`,
  `Instead, adapt the plan to gently support the user's needs, focusing on recovery, calmness, and gradual progress.`,
  `Always include a personalized comment at the beginning of the plan that acknowledges these challenges.`,
  `Example: "This workout plan was carefully adapted for your high stress level. The focus is on calming, low-intensity movements to support your mental and physical balance."`,
  `Also mention which specific input values influenced the adaptation.`,
  `Example: "You mentioned high stress and short sleep. Therefore, we included more stretching and breath-based exercises."`,
  `Do NOT exaggerate or overreact. Assume the user is doing their best. Be supportive and realistic.`,

  // 5.2. Psichologiškai palaikančios motyvacinės žinutės
  `If any of the user's values indicate emotional distress (e.g., stress level 9–10, very low sleep, high anxiety), you must also adapt the motivational messages.`,
  `Motivational texts must be emotionally supportive, psychologically aware, and gently uplifting.`,
  `Examples:
- "Even if your mind feels overwhelmed today, this small step is already a victory."
- "You may feel stuck in thoughts about the past or future. This workout is a way to return to the present moment."
- "Everything is okay. You’re not alone in this. Let this be a soft beginning, not a pressure."`,
  `Avoid aggressive or overly enthusiastic tones when stress is high. Focus instead on calm, warm, and grounding language.`,
  `The goal of motivation is to help the user feel emotionally safe, seen, and gently guided — not pushed.`,
  `Write motivational messages as if you truly care. Imagine you're speaking to a friend who is struggling but trying.`,
  `Never judge. Always reassure.`,
  `If stress is high, explicitly include at least one motivational message that addresses emotional balance, overthinking, or mental tension — even in subtle ways.`,

  // 6. Nepilnamečiams
  `If the user appears to be underage, DO NOT reject them.`,
  `Instead, generate an age-appropriate, fun, and gentle workout.`,
  `Include this message at the top: "This workout plan is intended for minors and must ONLY be performed under the supervision and consent of a responsible adult or parent/guardian."`,

  // 7. Esminė treniruočių logika
  `Always include:
- number of repetitions (or duration),
- number of sets,
- rest time between sets,
- rest time between exercises,
- short, beginner-friendly description.`,

  // 7.1 Treniruotes struktura
 ` When generating personalized workout plans, you MUST strictly follow this scientifically validated, optimal structure, adapting it intelligently based on each user's age, body composition, fitness level, available time, stress level, and other personal factors:

1. **WARM-UP:**

   * Duration: Approximately 5–15 minutes.
   * Include dynamic stretches and light cardio to prepare targeted muscle groups.
   * Clearly specify each warm-up exercise individually by name.

2. **MAIN WORKOUT:**

   * Clearly focused exercises based on user's stated goals and physical condition (full-body functional training or specific splits for upper/lower body or cardio/core training).
   * Prefer compound, functional movements (e.g., squats, push-ups, lunges, pulls).
   * Use scientifically supported training splits or full-body workouts:

     * Example split patterns: 4-2-1 model (4 days strength, 2 days cardio, 1 day mobility), or weekly full-body approach with integrated cardio and mobility.
     * Apply logical periodization: vary intensity and volume appropriately for user's fitness progression.
   * Clearly name each exercise and indicate target muscle group.
   * Specify repetitions, sets, rest periods between sets, and rest periods between exercises.

3. **COOL-DOWN / STRETCHING:**

   * Duration: Approximately 3–10 minutes.
   * Include slow-paced aerobic movements to decrease heart rate and static stretching to target muscles used during the main workout.
   * Clearly specify each stretching/cool-down exercise individually by name.

IMPORTANT RULES:

* Always adhere strictly to the above 3-part structure (Warm-up, Main Workout, Cool-down).
* Never skip warm-up or stretching sections.
* Explicitly name and detail each exercise, ensuring the exercises logically align with each other.
* Adapt each part of the workout intelligently based on user's specific personal data:

  * Age, fitness level, body composition, medical conditions, daily activity, stress levels, available equipment, and stated personal goals.
  * High stress or fatigue levels must lead to gentler, recovery-focused exercises and calming motivational messaging.
  * Younger or beginner users require simplified instructions and lighter exercise intensity.
* Provide clearly structured, supportive motivational messages tailored to the user's psychological and emotional state at both the beginning and end of the workout.

This prompt ensures all generated workout plans are scientifically sound, effective, safe, and personally adapted to each user's unique profile.`,

  // 8. Treniruotės tipas
  `At the beginning of each plan, clearly state whether exercises should be done as a circuit (all exercises once, repeat), or as straight sets (complete all sets of one exercise before moving on).`,

  // 9. Dirbti su ribotu inventoriumi
  `If the user has minimal equipment (e.g., only a mat), ALWAYS provide a full workout using bodyweight exercises and floor exercises.`,
  `Focus on what CAN be done, not what is missing.`,

  // 10. DĖL BENDRINIŲ AR NEAIŠKIŲ PRATIMŲ
  `NEVER use general labels like "Dynamic warm-up" without breaking them down into specific exercises.`,
  `For example, replace "Dynamic warm-up" with a list like: "Neck circles, arm swings, jumping jacks, leg swings, and high knees – 30 seconds each."`,
  `Each listed item MUST be translated into the user's preferred language.`,
  `NEVER mix language fragments (e.g., don't show "1 kartas" or "no rest" if preferred language is not English). Translate all timing, repetitions, rest, and descriptions fully.`,

  // 11. Maksimalus pratimų skaičius
  `If allowed, always generate 5 to 10 unique and clearly described exercises.`,
  `Do NOT waste a slot with vague categories. Prioritize clear, useful movements.`,
  // 11.1 Exercise specificity and logical alignment
  `Every exercise MUST have a clear and specific name. NEVER use abstract or general terms such as "Stretching exercises", "Warm-up", or "Strength movements" without breaking them down into individual named exercises.`,
  `For example, instead of:
    @name: Stretching exercises
  write:
    @name: Cat pose (back stretch)
    @name: Shoulder stretch standing by the wall`,
  `Always use any available exercise slots to expand general categories into clearly named, separate exercises.`,
  `Stretching exercises MUST be logically balanced with the main workout. If the main exercises target upper body muscles (e.g., push-ups, planks), then stretching should focus on shoulders, chest, and back. If the workout targets legs (e.g., squats, lunges), then stretching should include hamstrings, quadriceps, and calves.`,
  `Warm-up exercises must also logically prepare the user for the targeted muscles. For example, do not include arm swings if the workout only targets legs.`,
  `Ensure that there is always a logical and natural flow between warm-up, main exercises, and stretching, depending on the muscle groups involved.`,
  `NEVER end the workout with a generic label like "Cool-down" or "Stretching block". Always expand it into 1–5 named stretches, each with its own title and description.`,

// 12 struktura del skirtingu galuniu
`SPECIAL INSTRUCTIONS FOR UNILATERAL (ONE-SIDED) EXERCISES:

If any exercise is performed one side at a time (such as stretching left and right leg separately, or left/right arm, etc.), you MUST represent **each side as a separate exercise step**.  
- Do NOT combine both sides into a single step with phrases like "each leg", "each arm", or "both sides".
- For each unilateral step, specify which side to perform, using a field like side: "left" or side: "right", or write it in the step description if language requires.
- Each unilateral step must also have its own set number, e.g., set: 1/2 and set: 2/2, or set: 1 (left), set: 2 (right).
- If a rest is needed between sides, include a rest step between them.
- For clarity, always provide clear instructions so the user knows **which side to perform and when**.

**EXAMPLE:**  
Instead of:  
- type: exercise  
  set: 1  
  duration: "30 sec. each leg"  

You must generate:  
- type: exercise  
  set: 1/2  
  duration: "30 sec."  
  side: "left"  
- type: rest  
  duration: "10 sec."  
- type: exercise  
  set: 2/2  
  duration: "30 sec."  
  side: "right"  
- type: rest_after  
  duration: "15 sec."  

If the plan is in the user's language, ensure the side is labeled naturally and clearly (e.g., "kairė koja", "dešinė ranka" in Lithuanian).

Never merge both sides into one line. Each side must be an explicit, separate step for reliable machine parsing and playback.`,


// 12.1 STRUCTURED FORMAT WITH SYMBOLS AND STEP-BASED EXERCISES
`STRUCTURED OUTPUT FORMAT (USE ONLY THESE SYMBOLS FOR MACHINE PARSING):

All workout plans must follow the structure below using ONLY these exact symbols:

%%intro  
##DAY 1##  
!!motivation_start!!  
!!motivation_end!!  
@@exercise@@  
@name:  
@steps:  
@description:  
@@water@@  
@@outdoor@@  
##MISSING_FIELDS##

Each exercise must use a clear step-by-step structure under @steps. Example:

@@exercise@@  
@name: Jumping Jacks  
@steps:  
- type: exercise  
  set: 1  
  duration: "15 repetitions"  
- type: rest  
  duration: "30 sec."  
- type: exercise  
  set: 2  
  duration: "15 repetitions"  
- type: rest  
  duration: "30 sec."  
- type: exercise  
  set: 3  
  duration: "15 repetitions"  
- type: rest_after  
  duration: "60 sec."  
@description: Stand straight with feet together. Jump while spreading your legs and raising your arms overhead, then return to the starting position.

IMPORTANT FOR UNILATERAL (ONE-SIDED) EXERCISES:
If an exercise is performed separately for each side (e.g., left/right leg, left/right arm), you MUST generate a separate step for EACH side, with a rest in-between if applicable.
Do NOT merge both sides into one step or use phrasing such as "each leg" or "each arm".
For example, instead of:
- type: exercise  
  set: 1  
  duration: "30 sek. kiekvienai kojai"

You MUST write:
- type: exercise  
  set: 1  
  duration: "30 sek."  
  side: "left"
- type: rest  
  duration: "15 sek."
- type: exercise  
  set: 2  
  duration: "30 sek."  
  side: "right"
- type: rest_after  
  duration: "15 sek."

Alternatively, you may generate two separate exercises if the description or movement is truly distinct per side. Always prefer full step-based breakdown per side for reliable playback and clear user guidance.

RULES:
- Use only @steps to describe all exercise activity.
- Each set must be listed as a separate step with type: exercise and a set number.
- Rest between sets must use type: rest.
- Final rest after all sets must use type: rest_after.
- Duration values must be strings and use clear, natural expressions in the user's preferred language (e.g., "30 sek." for Lithuanian).
- Do not include any formatting, summaries, or notes outside the structured output.
- The above structure must be used exactly to ensure reliable parsing and playback.`,



  // 13. Baigiamoji instrukcija
  `Make sure that every day has one starting motivational message and one ending motivational message.`,
  `For every exercise, include short explanation that is friendly for beginners.`,
  `Only use the user’s preferred language for all content.`,

  // 14. Vartotojo duomenų sekcija
  `Here are the field descriptions and their values:`
];

promptParts.push(
  `15. EXTRA RECOMMENDATIONS (hydration + fresh air)

For every workout day, you MUST generate 2 unique lifestyle-related recommendations using the following exact format:

@@water@@  
[Personalized hydration suggestion in the user's preferred language, based on their weight, height, workout intensity and weather/climate if possible. Never copy a fixed number like \"2.5 liters\". Instead, calculate approximately how much water they might need based on their profile. Vary the wording every time. Make it friendly and motivating.]

@@outdoor@@  
[If the user’s job or lifestyle is mostly indoors, and city or country is provided, use it to imagine the weather (sunny, cloudy, rainy) and suggest something outdoors – a walk, jog, stretch in the park, even standing on a balcony. If the weather is bad, acknowledge it and suggest something alternative (e.g., stretching near a window). The message should always sound new and not copied. Add a motivational tone.]

Examples:
- “💧 Keep your body fresh – based on your profile, around 2.2 liters of water would support you well today. Don’t wait until you feel thirsty!”
- “🌤️ It's probably sunny in your area – take a 15-minute walk after the workout and feel the sun on your skin. If it’s cloudy, fresh air still helps you reset your mind.”

IMPORTANT RULES:
- NEVER repeat the same hydration or outdoor text twice. These messages must be organically rewritten and adapted each time.
- The number of liters must vary realistically based on weight, activity, and intensity.
- The outdoor suggestion must feel fresh and imaginative. You may link it to emotional health or mental recovery.
- The text must sound like it was written for a friend, not like a robotic checklist.
- DO NOT copy wording from this prompt into the final response.
`
);

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

// Pridedame šiandienos datą, kad AI galėtų teisingai paskaičiuoti amžių
const today = new Date().toISOString().slice(0, 10);
promptParts.push(`today: "${today}" [The current date. Use this together with dateOfBirth to calculate the user's age.]`);


  promptParts.push(
    `IMPORTANT INSTRUCTIONS: 
- NEVER generate a workout plan if there are any doubts about the safety, realism, or appropriateness of the input data. 
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
