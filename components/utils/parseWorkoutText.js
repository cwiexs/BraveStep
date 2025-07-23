// Atnaujintas failas parseWorkoutText.js su nauja @steps struktūra

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

    if (trimmed.startsWith("%%intro")) {
      section = "intro";
      continue;
    }
    if (trimmed.startsWith("##DAY ")) {
      const dayNumber = trimmed.match(/##DAY (\d+)##/);
      if (dayNumber) {
        currentDay = {
          day: parseInt(dayNumber[1]),
          motivationStart: "",
          motivationEnd: "",
          exercises: [],
          waterRecommendation: "",
          outdoorSuggestion: ""
        };
        result.days.push(currentDay);
        section = "day";
      }
      continue;
    }
    if (trimmed.startsWith("!!motivation_start!!")) {
      section = "motivationStart";
      continue;
    }
    if (trimmed.startsWith("!!motivation_end!!")) {
      section = "motivationEnd";
      continue;
    }
    if (trimmed.startsWith("@@exercise@@")) {
      currentExercise = {
        name: "",
        steps: [],
        description: ""
      };
      currentDay.exercises.push(currentExercise);
      section = "exercise";
      isStepsSection = false;
      currentSteps = [];
      continue;
    }
    if (trimmed.startsWith("@@water@@")) {
      section = "water";
      continue;
    }
    if (trimmed.startsWith("@@outdoor@@")) {
      section = "outdoor";
      continue;
    }
    if (trimmed.startsWith("##MISSING_FIELDS##")) {
      section = "missingFields";
      continue;
    }

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

  // Priskirti surinktus žingsnius
  if (currentExercise && currentSteps.length > 0) {
    currentExercise.steps = currentSteps;
  }

  return result;
}
