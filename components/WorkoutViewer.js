import { X } from "lucide-react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { useTranslation } from "next-i18next";

export default function WorkoutViewer({ planText, onClose }) {
  const { t } = useTranslation("common"); // naudok bendrą žodyną

  if (!planText) return null;

  const parsedPlan = parseWorkoutText(planText);

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Paversk step objektą į gražų, išverstą tekstą
  function renderStep(step) {
    // String tipo žingsniai – rodom kaip yra (tai paprastai laisvas tekstas)
    if (typeof step === "string") return step;

    if (typeof step === "object" && step) {
      const type = step.type;

      if (type === "exercise") {
        // pvz.: "Serija 1 — 30 sek." arba "Serija — 12 kartų"
        const series = step.set ? `${t("set")} ${step.set}` : t("set");
        const duration = step.duration ? ` — ${step.duration}` : "";
        return `${series}${duration}`;
      }

      if (type === "rest") {
        // pvz.: "Poilsis — 30 sek."
        const duration = step.duration ? ` — ${step.duration}` : "";
        return `${t("rest")}${duration}`;
      }

      if (type === "rest_after") {
        // pvz.: "Poilsis po pratimo — 60 sek."
        const duration = step.duration ? ` — ${step.duration}` : "";
        return `${t("rest_after")}${duration}`;
      }

      // Neatpažintas tipas – bandome parodyti trukmę ar fallback
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
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-1">
              {day.dayTitle || `${t("day")} ${day.day}`}
            </h3>

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
