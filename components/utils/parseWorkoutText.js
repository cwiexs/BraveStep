
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
    if (line.startsWith("%%intro")) {
      section = "intro";
    } else if (line.startsWith("##DAY")) {
      const dayMatch = line.match(/##DAY (\d+)##/);
      if (dayMatch) {
        currentDay = {
          day: Number(dayMatch[1]),
          motivationStart: "",
          motivationEnd: "",
          exercises: []
        };
        result.days.push(currentDay);
      }
    } else if (line.startsWith("!!motivation_start!!")) {
      section = "motivationStart";
    } else if (line.startsWith("!!motivation_end!!")) {
      section = "motivationEnd";
    } else if (line.startsWith("@@exercise@@")) {
      currentExercise = {
        name: "",
        reps: "",
        sets: "",
        restBetweenSets: "",
        restAfterExercise: "",
        description: ""
      };
      if (currentDay) currentDay.exercises.push(currentExercise);
      section = "exercise";
    } else if (line.startsWith("@reps:")) {
      if (currentExercise) currentExercise.reps = line.replace("@reps:", "").trim();
    } else if (line.startsWith("@sets:")) {
      if (currentExercise) currentExercise.sets = line.replace("@sets:", "").trim();
    } else if (line.startsWith("@rest_sets:")) {
      if (currentExercise) currentExercise.restBetweenSets = line.replace("@rest_sets:", "").trim();
    } else if (line.startsWith("@rest_after:")) {
      if (currentExercise) currentExercise.restAfterExercise = line.replace("@rest_after:", "").trim();
    } else if (line.startsWith("@description:")) {
      if (currentExercise) currentExercise.description = line.replace("@description:", "").trim();
    } else {
      if (section === "intro") {
        result.introduction += line + "\n";
      } else if (section === "motivationStart") {
        if (currentDay) currentDay.motivationStart += line + " ";
      } else if (section === "motivationEnd") {
        if (currentDay) currentDay.motivationEnd += line + " ";
      } else if (section === "exercise" && currentExercise && !currentExercise.name) {
        currentExercise.name = line.trim();
      }
    }
  }

  return result;
}
