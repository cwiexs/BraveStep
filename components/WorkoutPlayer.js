import { useEffect, useState } from "react";

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const day = workoutData.days[currentDay];
  const exercise = day.exercises[currentExerciseIndex];

  function parseSeconds(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  useEffect(() => {
    if (secondsLeft > 0) {
      const interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (secondsLeft === 0 && timer) {
      handleTimerComplete();
    }
  }, [secondsLeft, timer]);

  function startTimer(duration, type) {
    if (duration > 0) {
      setSecondsLeft(duration);
      setTimer(type);
    } else {
      handleTimerComplete();
    }
  }

  function handleTimerComplete() {
    if (timer === "exercise") {
      const totalSets = parseInt(exercise.sets) || 1;
      const restBetween = parseSeconds(exercise.restBetweenSets);

      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        startTimer(restBetween, "rest");
      } else {
        const restAfter = parseSeconds(exercise.restAfterExercise);
        setCurrentSet(1);

        if (currentExerciseIndex + 1 < day.exercises.length) {
          setCurrentExerciseIndex(prev => prev + 1);
          startTimer(restAfter, "rest");
        } else {
          alert("Treniruotė baigta!");
          onClose();
        }
      }
    } else if (timer === "rest") {
      const duration = exercise.reps.includes("sekund") ? parseSeconds(exercise.reps) : 0;
      if (currentSet <= parseInt(exercise.sets)) {
        startTimer(duration, "exercise");
      } else {
        setTimer(null);
      }
    }
  }

  function handleManualNext() {
    const isTimed = exercise.reps.includes("sekund");
    const duration = isTimed ? parseSeconds(exercise.reps) : 0;

    if (isTimed) {
      startTimer(duration, "exercise");
    } else {
      handleTimerComplete();
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
            onClick={handleManualNext}
          >
            {exercise.reps.includes("sekund") ? "Pradėti laikmatį" : "Pratimas atliktas"}
          </button>
        )}
        <button onClick={onClose} className="mt-4 text-red-500">Uždaryti</button>
      </div>
    </div>
  );
}
