// Saugi parseWorkoutText.js versija su žingsnių generavimu tik pabaigoje

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
  let setCount = 0;
  let restBetween = "";
  let restAfter = "";
  let reps = "";

  function extractNumberFrom(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

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
      if (currentExercise) {
        // Generuojam žingsnius tik čia
        if (setCount > 0 && reps > 0 && restBetween) {
          const steps = [];
          for (let i = 1; i <= setCount; i++) {
            steps.push({
              type: "exercise",
              set: i,
              duration: reps + " sek."
            });
            if (i < setCount) {
              steps.push({
                type: "rest",
                set: i,
                duration: restBetween
              });
            }
          }
          if (restAfter) {
            steps.push({
              type: "rest_after",
              set: null,
              duration: restAfter
            });
          }
          currentExercise.steps = steps;
        }
      }
      currentExercise = {
        name: "",
        steps: [],
        description: ""
      };
      currentDay.exercises.push(currentExercise);
      section = "exercise";
      setCount = 0;
      restBetween = "";
      restAfter = "";
      reps = "";
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
      } else if (trimmed.startsWith("@sets:")) {
        setCount = extractNumberFrom(trimmed);
      } else if (trimmed.startsWith("@rest_sets:")) {
        restBetween = trimmed.replace("@rest_sets:", "").trim();
      } else if (trimmed.startsWith("@rest_after:")) {
        restAfter = trimmed.replace("@rest_after:", "").trim();
      } else if (trimmed.startsWith("@reps:")) {
        reps = extractNumberFrom(trimmed);
      }
    } else if (section === "water") {
      currentDay.waterRecommendation += trimmed + " ";
    } else if (section === "outdoor") {
      currentDay.outdoorSuggestion += trimmed + " ";
    } else if (section === "missingFields") {
      result.missingFields += trimmed + "\n";
    }
  }

  // Priskiriam paskutinio pratimo žingsnius
  if (currentExercise && setCount > 0 && reps > 0 && restBetween) {
    const steps = [];
    for (let i = 1; i <= setCount; i++) {
      steps.push({
        type: "exercise",
        set: i,
        duration: reps + " sek."
      });
      if (i < setCount) {
        steps.push({
          type: "rest",
          set: i,
          duration: restBetween
        });
      }
    }
    if (restAfter) {
      steps.push({
        type: "rest_after",
        set: null,
        duration: restAfter
      });
    }
    currentExercise.steps = steps;
  }

  return result;
}