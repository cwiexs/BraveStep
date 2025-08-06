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
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative p-6">
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

        {parsedPlan?.sections?.map((section, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1">
              {section.title}
            </h3>
            <div className="space-y-4">
              {section.exercises.map((exercise, eIdx) => (
                <div
                  key={eIdx}
                  className="p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition"
                >
                  <p className="text-lg font-medium text-gray-900">
                    {exercise.name}
                  </p>
                  {exercise.details && (
                    <p className="text-sm text-gray-600 italic mb-1">
                      {exercise.details}
                    </p>
                  )}
                  {exercise.description && (
                    <p className="text-sm text-gray-700">
                      {exercise.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
