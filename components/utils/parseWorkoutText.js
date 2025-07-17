function parseWorkoutText(text) {
  const introMatch = text.match(/%%intro\s+([\s\S]*?)\n(?=##DAY|@@exercise@@|%%|##MISSING_FIELDS##)/);
  const hydrationMatch = text.match(/%%hydration%%\s+"?([^"]+)"?/);
  const outdoorMatch = text.match(/%%outdoor%%\s+"?([^"]+)"?/);
  const inspirationMatch = text.match(/%%inspiration%%\s+"?([^"]+)"?/);

  const motivationMatch = text.match(/!!motivation_start!!\s+"([^"]+)"\s+!!motivation_end!!\s+"([^"]+)"/);
  const missingFieldsMatch = text.match(/##MISSING_FIELDS##\s+([\s\S]*)/);

  const daySections = text.split(/##DAY \d+##/g).filter(s => s.trim());

  const workouts = daySections.map(section => {
    const exercises = [...section.matchAll(/@@exercise@@\s+([\s\S]*?)(?=(?:@@exercise@@|%%|##MISSING_FIELDS##|$))/g)].map(match => {
      const ex = match[1];
      const name = ex.match(/@name: (.*)/)?.[1]?.trim();
      const reps = ex.match(/@reps: (.*)/)?.[1]?.trim();
      const sets = ex.match(/@sets: (.*)/)?.[1]?.trim();
      const rest_sets = ex.match(/@rest_sets: (.*)/)?.[1]?.trim();
      const rest_after = ex.match(/@rest_after: (.*)/)?.[1]?.trim();
      const description = ex.match(/@description: ([\s\S]*)/)?.[1]?.trim();

      return {
        name,
        reps,
        sets,
        rest_sets,
        rest_after,
        description
      };
    });

    return { exercises };
  });

  return {
    intro: introMatch ? introMatch[1].trim() : null,
    hydration: hydrationMatch ? hydrationMatch[1].trim() : null,
    outdoor: outdoorMatch ? outdoorMatch[1].trim() : null,
    inspiration: inspirationMatch ? inspirationMatch[1].trim() : null,
    motivation_start: motivationMatch ? motivationMatch[1] : null,
    motivation_end: motivationMatch ? motivationMatch[2] : null,
    workouts,
    missingFields: missingFieldsMatch ? missingFieldsMatch[1].trim() : null,
  };
}

module.exports = parseWorkoutText;
