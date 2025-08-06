import { X } from "lucide-react";
import { parseWorkoutText } from "./utils/parseWorkoutText";

export default function WorkoutViewer({ planText, onClose }) {
  if (!planText) return null;

  const parsedPlan = parseWorkoutText(planText);

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        {/* Uždarymo mygtukas */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-blue-900">
          Treniruotės planas
        </h2>

        {/* Įvadas */}
        {parsedPlan?.introduction && (
          <p className="mb-6 text-gray-700">{parsedPlan.introduction}</p>
        )}

        {/* Dienos planai */}
        {parsedPlan?.days?.map((day, dayIndex) => (
          <div key={dayIndex} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-1">
              {day.dayTitle}
            </h3>

            {/* Motyvacija pradžiai */}
            {day.motivation && (
              <p className="mb-4 italic text-green-700">{day.motivation}</p>
            )}

            {/* Pratimai */}
            {day.exercises.map((exercise, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className="p-4 rounded-lg border border-gray-200 shadow-sm mb-4"
              >
                <p className="text-lg font-medium text-gray-900">
                  {exercise.name}
                </p>

                {/* Žingsniai */}
                {exercise.steps && (
                  <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                    {exercise.steps.map((step, stepIndex) => {
                      if (typeof step === "string") {
                        return <li key={stepIndex}>{step}</li>;
                      }
                      if (typeof step === "object") {
                        return (
                          <li key={stepIndex}>
                            {step.type ? step.type : ""}{" "}
                            {step.set ? `- ${step.set} set` : ""}{" "}
                            {step.duration ? `(${step.duration})` : ""}
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>
                )}

                {/* Aprašymas */}
                {exercise.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {exercise.description}
                  </p>
                )}
              </div>
            ))}

            {/* Vandens rekomendacija */}
            {day.waterIntake && (
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-900 mt-4">
                💧 {day.waterIntake}
              </div>
            )}

            {/* Lauko veikla */}
            {day.outdoorActivity && (
              <div className="p-4 bg-green-50 rounded-lg text-sm text-green-900 mt-4">
                🌿 {day.outdoorActivity}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
