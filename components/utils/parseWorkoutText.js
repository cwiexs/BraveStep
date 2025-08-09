export function parseWorkoutText(planText) {
  const lines = planText.split("\n");
  const result = {
    introduction: "",
    days: [],
    missingFields: ""
  };

  let currentDay = null;
  let currentExercise = null;
  let section = "intro";
  let isStepsSection = false;
  let currentSteps = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Praleidžiam tuščias eilutes
    if (!trimmed) continue;

    // 🔹 Naujas filtras – praleidžiam visus specialius atskirtukus
    if (
      trimmed.startsWith("%%") ||
      trimmed.startsWith("##") ||
      trimmed.startsWith("@@") ||
      trimmed.startsWith("!!")
    ) {
      // Bet prieš tai apdorojam tuos atskirtukus, kurie keičia sekciją
      if (trimmed.startsWith("%%intro")) {
        section = "intro";
      } else if (trimmed.startsWith("##DAY ")) {
        const dayNumber = trimmed.match(/##DAY (\d+)##/);
        if (dayNumber) {
          currentDay = {
            day: parseInt(dayNumber[1]),
            motivationStart: "",
            motivationEnd: "",
            motivation: "",
            exercises: [],
            waterRecommendation: "",
            outdoorSuggestion: ""
          };
          result.days.push(currentDay);
          section = "day";
        }
      } else if (trimmed.startsWith("!!motivation_start!!")) {
        section = "motivationStart";
      } else if (trimmed.startsWith("!!motivation_end!!")) {
        section = "motivationEnd";
      } else if (trimmed.startsWith("@@exercise@@")) {
        if (currentExercise && currentSteps.length > 0) {
          currentExercise.steps = currentSteps;
        }
        currentExercise = {
          name: "",
          steps: [],
          description: ""
        };
        currentDay.exercises.push(currentExercise);
        section = "exercise";
        isStepsSection = false;
        currentSteps = [];
      } else if (trimmed.startsWith("@@water@@")) {
        section = "water";
      } else if (trimmed.startsWith("@@outdoor@@")) {
        section = "outdoor";
      } else if (trimmed.startsWith("##MISSING_FIELDS##")) {
        section = "missingFields";
      }
      continue; // jokio rodymo
    }

    // Įprastas apdorojimas
    if (section === "intro") {
      result.introduction += trimmed + "\n";
    } else if (section === "motivationStart") {
      currentDay.motivationStart += trimmed + " ";
    } else if (section === "motivationEnd") {
      currentDay.motivationEnd += trimmed + " ";
    } else if (section === "exercise") {
      if (trimmed.startsWith("@name:")) {
        currentExercise.name = trimmed.replace("@name:", "").trim();
      } else if (trimmed.startsWith("@description:")) {
        currentExercise.description = trimmed.replace("@description:", "").trim();
      } else if (trimmed.startsWith("@steps:")) {
        isStepsSection = true;
      } else if (isStepsSection && trimmed.startsWith("- type:")) {
        const step = {
          type: trimmed.replace("- type:", "").trim(),
          set: null,
          duration: null
        };
        currentSteps.push(step);
      } else if (isStepsSection && trimmed.startsWith("set:")) {
        const lastStep = currentSteps[currentSteps.length - 1];
        if (lastStep) {
          lastStep.set = parseInt(trimmed.replace("set:", "").trim());
        }
      } else if (isStepsSection && trimmed.startsWith("duration:")) {
        const lastStep = currentSteps[currentSteps.length - 1];
        if (lastStep) {
          lastStep.duration = trimmed.replace("duration:", "").trim().replace(/^\"|\"$/g, "");
        }
      }
    } else if (section === "water") {
      currentDay.waterRecommendation += trimmed + " ";
    } else if (section === "outdoor") {
      currentDay.outdoorSuggestion += trimmed + " ";
    } else if (section === "missingFields") {
      result.missingFields += trimmed + "\n";
    }
  }

  if (currentExercise && currentSteps.length > 0) {
    currentExercise.steps = currentSteps;
  }

  // Sukuriam jungtinę motyvaciją
  result.days.forEach(day => {
    day.motivation = `${day.motivationStart} ${day.motivationEnd}`.trim();
  });

  return result;
}
