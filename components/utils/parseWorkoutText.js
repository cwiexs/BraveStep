export function parseWorkoutText(planText) {
  const result = {
    introduction: "",
    days: [],
    missingFields: ""
  };

  if (!planText || typeof planText !== "string") return result;

  const lines = planText.split("\n");

  let currentDay = null;
  let currentExercise = null;
  let section = "intro";
  let isStepsSection = false;
  let currentSteps = [];

  // Užtikrina, kad visada turėtume bent vieną dieną,
  // jei AI nepateikė "##DAY X##" antraštės.
  function ensureDay() {
    if (currentDay) return;
    currentDay = {
      day: result.days.length + 1,
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

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Žymekliai – sekcijų perjungimas
    if (
      trimmed.startsWith("%%") ||
      trimmed.startsWith("##") ||
      trimmed.startsWith("@@") ||
      trimmed.startsWith("!!")
    ) {
      if (trimmed.toLowerCase().startsWith("%%intro")) {
        section = "intro";
      } else if (/^##day\s+\d+##/i.test(trimmed)) {
        const dayNumber = trimmed.match(/^##day\s+(\d+)##/i);
        if (dayNumber) {
          currentDay = {
            day: parseInt(dayNumber[1], 10),
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
      } else if (/^!!\s*motivation_start\s*!!/i.test(trimmed)) {
        ensureDay();
        section = "motivationStart";
      } else if (/^!!\s*motivation_end\s*!!/i.test(trimmed)) {
        ensureDay();
        section = "motivationEnd";
      } else if (/^@@exercise@@/i.test(trimmed)) {
        ensureDay();
        if (currentExercise && currentSteps.length > 0) {
          currentExercise.steps = currentSteps;
        }
        currentExercise = { name: "", steps: [], description: "" };
        currentDay.exercises.push(currentExercise);
        section = "exercise";
        isStepsSection = false;
        currentSteps = [];
      } else if (/^@@water@@/i.test(trimmed)) {
        ensureDay();
        section = "water";
      } else if (/^@@outdoor@@/i.test(trimmed)) {
        ensureDay();
        section = "outdoor";
      } else if (/^##MISSING_FIELDS##/i.test(trimmed)) {
        section = "missingFields";
      }
      continue;
    }

    // Turinys
    if (section === "intro") {
      result.introduction += trimmed + "\n";

    } else if (section === "motivationStart") {
      ensureDay();
      currentDay.motivationStart += trimmed + " ";

    } else if (section === "motivationEnd") {
      ensureDay();
      currentDay.motivationEnd += trimmed + " ";

    } else if (section === "exercise") {
      ensureDay();
      if (trimmed.toLowerCase().startsWith("@name:")) {
        currentExercise.name = trimmed.replace(/@name:\s*/i, "").trim();
      } else if (trimmed.toLowerCase().startsWith("@description:")) {
        currentExercise.description = trimmed.replace(/@description:\s*/i, "").trim();
      } else if (trimmed.toLowerCase().startsWith("@steps:")) {
        isStepsSection = true;
      } else if (isStepsSection && /^-+\s*type:/i.test(trimmed)) {
        const step = {
          type: trimmed.replace(/-+\s*type:\s*/i, "").trim(),
          set: null,
          duration: null,
          label: null,
          setLabel: null
        };
        currentSteps.push(step);
      } else if (isStepsSection && /^set:/i.test(trimmed)) {
        const lastStep = currentSteps[currentSteps.length - 1];
        if (lastStep) {
          const n = parseInt(trimmed.replace(/set:\s*/i, "").trim(), 10);
          lastStep.set = Number.isFinite(n) ? n : lastStep.set;
        }
      } else if (isStepsSection && /^duration:/i.test(trimmed)) {
        const lastStep = currentSteps[currentSteps.length - 1];
        if (lastStep) {
          lastStep.duration = trimmed
            .replace(/duration:\s*/i, "")
            .trim()
            .replace(/^\"|\"$/g, "");
        }
      } else if (isStepsSection && /^label:/i.test(trimmed)) {
        const lastStep = currentSteps[currentSteps.length - 1];
        if (lastStep) {
          lastStep.label = trimmed
            .replace(/label:\s*/i, "")
            .trim()
            .replace(/^\"|\"$/g, "");
        }
      } else if (isStepsSection && /^set_label:/i.test(trimmed)) {
        const lastStep = currentSteps[currentSteps.length - 1];
        if (lastStep) {
          lastStep.setLabel = trimmed
            .replace(/set_label:\s*/i, "")
            .trim()
            .replace(/^\"|\"$/g, "");
        }
      }

    } else if (section === "water") {
      ensureDay();
      currentDay.waterRecommendation += trimmed + " ";

    } else if (section === "outdoor") {
      ensureDay();
      currentDay.outdoorSuggestion += trimmed + " ";

    } else if (section === "missingFields") {
      result.missingFields += trimmed + "\n";
    }
  }

  // Uždaryti paskutinio pratimo žingsnius
  if (currentExercise && currentSteps.length > 0) {
    currentExercise.steps = currentSteps;
  }

  // Sujungti motyvaciją
  result.days.forEach((day) => {
    const a = (day.motivationStart || "").trim();
    const b = (day.motivationEnd || "").trim();
    day.motivation = [a, b].filter(Boolean).join(" ").trim();
  });

  return result;
}
