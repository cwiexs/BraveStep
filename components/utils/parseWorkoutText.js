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
          exercises: []
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
        reps: "",
        sets: "",
        restBetweenSets: "",
        restAfterExercise: "",
        description: ""
      };
      currentDay.exercises.push(currentExercise);
      section = "exercise";
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
      if (trimmed.startsWith("@reps:")) {
        currentExercise.reps = trimmed.replace("@reps:", "").trim();
      } else if (trimmed.startsWith("@sets:")) {
        currentExercise.sets = trimmed.replace("@sets:", "").trim();
      } else if (trimmed.startsWith("@rest_sets:")) {
        currentExercise.restBetweenSets = trimmed.replace("@rest_sets:", "").trim();
      } else if (trimmed.startsWith("@rest_after:")) {
        currentExercise.restAfterExercise = trimmed.replace("@rest_after:", "").trim();
      } else if (trimmed.startsWith("@description:")) {
        currentExercise.description = trimmed.replace("@description:", "").trim();
      }
    } else if (section === "missingFields") {
      result.missingFields += trimmed + "\n";
    }
  }

  return result;
}
