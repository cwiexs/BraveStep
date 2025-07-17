function parseWorkoutText(text) {
  const lines = text.split('\n');
  const result = {
    introduction: "",
    days: [],
    hydration: "",
    outdoorEncouragement: "",
    inspirationSeeds: "",
    missingFields: ""
  };

  let currentDay = null;
  let currentExercise = null;
  let section = null;

  for (let line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith("%%intro")) {
      section = "intro";
      continue;
    }

    if (trimmed.startsWith("##DAY")) {
      currentDay = {
        dayTitle: trimmed,
        motivationStart: "",
        motivationEnd: "",
        exercises: []
      };
      result.days.push(currentDay);
      section = "day";
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
      if (currentDay) {
        currentExercise = {
          name: "",
          reps: "",
          sets: "",
          rest_sets: "",
          rest_after: "",
          description: ""
        };
        currentDay.exercises.push(currentExercise);
      }
      section = "exercise";
      continue;
    }

    if (trimmed.startsWith("%%hydration%%")) {
      section = "hydration";
      continue;
    }

    if (trimmed.startsWith("%%outdoor%%")) {
      section = "outdoor";
      continue;
    }

    if (trimmed.startsWith("%%inspiration%%")) {
      section = "inspiration";
      continue;
    }

    if (trimmed.startsWith("##MISSING_FIELDS##")) {
      section = "missing";
      continue;
    }

    switch (section) {
      case "intro":
        result.introduction += trimmed + "\n";
        break;
      case "motivationStart":
        if (currentDay) currentDay.motivationStart += trimmed + "\n";
        break;
      case "motivationEnd":
        if (currentDay) currentDay.motivationEnd += trimmed + "\n";
        break;
      case "exercise":
        if (currentExercise) {
          if (trimmed.startsWith("@name:")) {
            currentExercise.name = trimmed.replace("@name:", "").trim();
          } else if (trimmed.startsWith("@reps:")) {
            currentExercise.reps = trimmed.replace("@reps:", "").trim();
          } else if (trimmed.startsWith("@sets:")) {
            currentExercise.sets = trimmed.replace("@sets:", "").trim();
          } else if (trimmed.startsWith("@rest_sets:")) {
            currentExercise.rest_sets = trimmed.replace("@rest_sets:", "").trim();
          } else if (trimmed.startsWith("@rest_after:")) {
            currentExercise.rest_after = trimmed.replace("@rest_after:", "").trim();
          } else if (trimmed.startsWith("@description:")) {
            currentExercise.description = trimmed.replace("@description:", "").trim();
          }
        }
        break;
      case "hydration":
        result.hydration += trimmed + "\n";
        break;
      case "outdoor":
        result.outdoorEncouragement += trimmed + "\n";
        break;
      case "inspiration":
        result.inspirationSeeds += trimmed + "\n";
        break;
      case "missing":
        result.missingFields += trimmed + "\n";
        break;
    }
  }

  return result;
}

module.exports = parseWorkoutText;