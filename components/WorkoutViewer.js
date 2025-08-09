import { X } from "lucide-react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { useTranslation } from "next-i18next";

// Fallback žodynas žingsnių labeliams, jei AI neįdėjo label/set_label
const FALLBACK = {
  lt: { set: "Serija", rest: "Poilsis", rest_after: "Poilsis po pratimo" },
  en: { set: "Set", rest: "Rest", rest_after: "Rest after exercise" },
  pl: { set: "Seria", rest: "Odpoczynek", rest_after: "Odpoczynek po ćwiczeniu" }
};

// Naudojame heuristiką iš teksto, jei negaunam plano kalbos (pasirinktinai)
function detectLocaleFromText(text) {
  const t = (text || "").toLowerCase();
  if (t.includes(" sek")) return "lt";
  if (t.includes(" kart")) return "lt";
  if (t.includes(" sec")) return "en";
  if (t.includes(" repetitions")) return "en";
  if (t.includes(" odpocz") || t.includes(" powtórz")) return "pl";
  return "en";
}

export default function WorkoutViewer({ planText, planLocale, onClose }) {
  const { t } = useTranslation("common"); // UI tekstams
  if (!planText) return null;

  const locale = planLocale || detectLocaleFromText(planText);
  const F = FALLBACK[locale] || FALLBACK.en;

  const parsedPlan = parseWorkoutText(planText);

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Formatuojame žingsnį: prioritetas AI labeliams, po to fallback
  function renderStep(step) {
    if (typeof step === "string") return step;

    if (step && typeof step === "object") {
      const type = step.type;

      if (type === "exercise") {
        const word = step.setLabel || F.set; // AI "set_label" > fallback
        const series = step.set ? `${word} ${step.set}` : word;
        const duration = step.duration ? ` — ${step.duration}` : "";
        return `${series}${duration}`;
      }

      if (type === "rest") {
        const word = step.label || F.rest; // AI "label" > fallback
        const duration = step.duration ? ` — ${step.duration}` : "";
        return `${word}${duration}`;
      }

      if (type === "rest_after") {
        const word = step.label || F.rest_after; // AI "label" > fallback
        const duration = step.duration ? ` — ${step.duration}` : "";
        return `${word}${duration}`;
      }

      return step.duration || "";
    }

    return "";
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label={t("close")}
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-blue-900">
          {t("workoutPlan")}
        </h2>

        {parsedPlan?.introduction && (
          <p className="mb-6 text-gray-700">{parsedPlan.introduction}</p>
        )}

        {parsedPlan?.days?.map((day, dayIndex) => (
          <div key={dayIndex} className="mb-8">

            {day.motivation && (
              <p className="mb-4 italic text-green-700">{day.motivation}</p>
            )}

            {day.exercises.map((exercise, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className="p-4 rounded-lg border border-gray-200 shadow-sm mb-4"
              >
                <p className="text-lg font-medium text-gray-900">
                  {exercise.name}
                </p>

                {exercise.steps?.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                    {exercise.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{renderStep(step)}</li>
                    ))}
                  </ul>
                )}

                {exercise.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {exercise.description}
                  </p>
                )}
              </div>
            ))}

            {day.waterRecommendation && (
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-900 mt-4">
                💧 {day.waterRecommendation}
              </div>
            )}

            {day.outdoorSuggestion && (
              <div className="p-4 bg-green-50 rounded-lg text-sm text-green-900 mt-4">
                🌿 {day.outdoorSuggestion}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
