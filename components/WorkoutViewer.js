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
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-blue-900">
          Treniruotės planas
        </h2>

        {parsedPlan?.introduction && (
          <p className="mb-6 text-gray-700">{parsedPlan.introduction}</p>
        )}

        {parsedPlan?.days?.map((day, dayIndex) => (
          <div key={dayIndex} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-1">
              {day.dayTitle}
            </h3>
            {day.exercises.map((exercise, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className="p-4 rounded-lg border border-gray-200 shadow-sm mb-4"
              >
                <p className="text-lg font-medium text-gray-900">
                  {exercise.name}
                </p>
                {exercise.steps && (
  <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
    {exercise.steps.map((step, stepIndex) => (
      <li key={stepIndex}>
        {typeof step === "string"
          ? step
          : `${step.type || ""} - ${step.set ? step.set + " set" : ""} ${step.duration || ""}`}
      </li>
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
            {day.motivation && (
              <p className="text-sm italic text-gray-500 mt-2">{day.motivation}</p>
            )}
            {day.waterIntake && (
              <p className="text-sm text-gray-500">{day.waterIntake}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
