import { useEffect, useState } from "react";

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const day = workoutData.days[currentDay];
  const exercise = day.exercises[currentExerciseIndex];

  useEffect(() => {
    if (secondsLeft > 0) {
      const interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 'exercise') {
      handleExerciseComplete();
    } else if (timer === 'rest') {
      setTimer(null);
    }
  }, [secondsLeft]);

  function startTimer(duration, type) {
    setSecondsLeft(duration);
    setTimer(type);
  }

  function handleExerciseComplete() {
    if (currentSet < parseInt(exercise.sets)) {
      setCurrentSet(prev => prev + 1);
      const restSeconds = parseInt(exercise.restBetweenSets) || 0;
      if (restSeconds > 0) {
        startTimer(restSeconds, 'rest');
      }
    } else {
      const restAfter = parseInt(exercise.restAfterExercise) || 0;
      if (currentExerciseIndex + 1 < day.exercises.length) {
        setCurrentExerciseIndex(prev => prev + 1);
      } else {
        alert("Treniruotė baigta!");
        onClose();
      }
      setCurrentSet(1);
      if (restAfter > 0) {
        startTimer(restAfter, 'rest');
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>
        <p className="mb-2">{exercise.description}</p>
        <p className="font-semibold mb-4">Serija {currentSet}/{exercise.sets}</p>
        {secondsLeft > 0 && <p className="text-4xl font-bold mb-4">{secondsLeft} sek.</p>}
        {!timer && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            onClick={() => {
              const durationMatch = exercise.reps.match(/\d+/);
              const duration = durationMatch ? parseInt(durationMatch[0]) : 0;
              if (duration > 0) {
                startTimer(duration, 'exercise');
              } else {
                handleExerciseComplete();
              }
            }}
          >
            {exercise.reps.includes("sekundžių") ? "Pradėti laikmatį" : "Pratimas atliktas"}
          </button>
        )}
        <button onClick={onClose} className="mt-4 text-red-500">Uždaryti</button>
      </div>
    </div>
  );
}
