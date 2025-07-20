import { useEffect, useState } from "react";

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState("idle"); // "exercise", "rest", "idle"
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
    } else if (secondsLeft === 0 && phase !== "idle") {
      handlePhaseComplete();
    }
  }, [secondsLeft, phase]);

  function playBeep() {
    const audio = new Audio("/beep.mp3"); // įkelk beep.mp3 į public/
    audio.play();
  }

  function startPhase(duration, nextPhase) {
    setSecondsLeft(duration);
    setPhase(nextPhase);
  }

  function handlePhaseComplete() {
    playBeep();
    const totalSets = parseInt(exercise.sets) || 1;
    const restBetween = parseSeconds(exercise.restBetweenSets);
    const restAfter = parseSeconds(exercise.restAfterExercise);

    if (phase === "exercise") {
      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        startPhase(restBetween, "rest");
      } else {
        if (currentExerciseIndex + 1 < day.exercises.length) {
          setCurrentSet(1);
          setCurrentExerciseIndex(prev => prev + 1);
          startPhase(restAfter, "rest");
        } else {
          alert("Treniruotė baigta!");
          onClose();
        }
      }
    } else if (phase === "rest") {
      startNextExerciseOrSet();
    }
  }

  function startNextExerciseOrSet() {
    const isTimed = exercise.reps.includes("sekund");
    const duration = isTimed ? parseSeconds(exercise.reps) : 0;
    startPhase(duration, "exercise");
  }

  function handleManualStart() {
    const isTimed = exercise.reps.includes("sekund");
    const duration = isTimed ? parseSeconds(exercise.reps) : 0;

    if (isTimed) {
      startPhase(duration, "exercise");
    } else {
      handlePhaseComplete();
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>
        <p className="mb-2">{exercise.description}</p>
        <p className="font-semibold mb-4">Serija {currentSet}/{exercise.sets}</p>
        {secondsLeft > 0 && (
          <p className="text-4xl font-bold mb-4">
            {phase === "rest" ? "Poilsis: " : ""}
            {secondsLeft} sek.
          </p>
        )}
        {phase === "idle" && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            onClick={handleManualStart}
          >
            {exercise.reps.includes("sekund") ? "Pradėti laikmatį" : "Pratimas atliktas"}
          </button>
        )}
        <button onClick={onClose} className="mt-4 text-red-500">Uždaryti</button>
      </div>
    </div>
  );
}
