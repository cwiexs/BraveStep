export function parseWorkoutText(planText) {
  const lines = planText.split("\n");
  const result = {
    introduction: "",
    days: []
  };

  let currentDay = null;
  let currentExercise = null;
  let section = "intro";

  for (const line of lines) {
    if (line.startsWith("===")) {
      const dayMatch = line.match(/(\d+)/);
      if (dayMatch) {
        currentDay = {
          day: Number(dayMatch[1]),
          motivationStart: "",
          motivationEnd: "",
          exercises: []
        };
        result.days.push(currentDay);
        section = "day";
      }
    } else if (line.includes("--- Motivation Start ---")) {
      section = "motivationStart";
    } else if (line.includes("--- Motivation End ---")) {
      section = "motivationEnd";
    } else if (line.startsWith("• Exercise Name:")) {
      currentExercise = {
        name: line.split(":")[1].trim(),
        reps: "",
        sets: "",
        restBetweenSets: "",
        restAfterExercise: "",
        description: ""
      };
      currentDay.exercises.push(currentExercise);
    } else if (line.includes("Reps:")) {
      currentExercise.reps = line.split(":")[1].trim();
    } else if (line.includes("Sets:")) {
      currentExercise.sets = line.split(":")[1].trim();
    } else if (line.includes("Rest between sets:")) {
      currentExercise.restBetweenSets = line.split(":")[1].trim();
    } else if (line.includes("Rest after exercise:")) {
      currentExercise.restAfterExercise = line.split(":")[1].trim();
    } else if (line.includes("Description:")) {
      currentExercise.description = line.split(":")[1].trim();
    } else {
      if (section === "intro") {
        result.introduction += line + "\n";
      } else if (section === "motivationStart") {
        currentDay.motivationStart += line + " ";
      } else if (section === "motivationEnd") {
        currentDay.motivationEnd += line + " ";
      }
    }
  }

  return result;
}
