import React from 'react';
import parseWorkoutText from './parseWorkoutText';

const Workouts = ({ workoutText }) => {
  if (!workoutText) return null;

  const parsed = parseWorkoutText(workoutText);

  return (
    <div className="space-y-6">
      {parsed.intro && (
        <div className="bg-gray-100 p-4 rounded">
          <p className="italic text-sm whitespace-pre-line">{parsed.intro}</p>
        </div>
      )}

      {parsed.days.map((day, index) => (
        <div key={index} className="border p-4 rounded space-y-2">
          <h2 className="text-lg font-semibold">{day.label}</h2>

          {day.motivationStart && (
            <div className="text-green-700 italic text-sm">{day.motivationStart}</div>
          )}

          {day.exercises.map((ex, i) => (
            <div key={i} className="bg-white shadow-sm p-3 rounded border space-y-1">
              <p><strong>{ex.reps}</strong>, {ex.sets}</p>
              <p>{ex.rest_sets} | {ex.rest_after}</p>
              <p className="text-gray-500 text-sm italic whitespace-pre-line">{ex.description}</p>
            </div>
          ))}

          {day.motivationEnd && (
            <div className="text-blue-700 italic text-sm">{day.motivationEnd}</div>
          )}
        </div>
      ))}

      {parsed.missingFields && (
        <div className="bg-yellow-100 p-4 rounded border border-yellow-300">
          <h3 className="font-semibold">Trūkstami laukai</h3>
          <p className="text-sm whitespace-pre-line">{parsed.missingFields}</p>
        </div>
      )}
    </div>
  );
};

export default Workouts;
