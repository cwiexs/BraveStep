import { useEffect, useState, useRef } from "react";

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const wakeLockRef = useRef(null);

  const day = workoutData.days[currentDay];
  const exercise = day.exercises[currentExerciseIndex];
  const step = exercise.steps[currentStepIndex];

  function parseSeconds(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        wakeLockRef.current = lock;
      }).catch(console.error);
    }

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  useEffect(() => {
    if (step.duration.includes("sek") || step.duration.includes("sec")) {
      setSecondsLeft(parseSeconds(step.duration));
      setPhase(step.type);
    } else {
      setWaitingForUser(true);
    }
  }, [currentExerciseIndex, currentStepIndex]);

  useEffect(() => {
    if (secondsLeft > 0) {
      const interval = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    } else if (secondsLeft === 0 && !waitingForUser) {
      handlePhaseComplete();
    }
  }, [secondsLeft]);

  function handlePhaseComplete() {
    if (currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      alert("Treniruotė baigta!");
      onClose();
    }
  }

  function handleManualContinue() {
    setWaitingForUser(false);
    handlePhaseComplete();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        {phase === "intro" ? (
          <>
            <h2 className="text-2xl font-bold mb-4">💡 Motyvacija</h2>
            <p className="mb-4 text-gray-800 whitespace-pre-wrap">{workoutData.introduction}</p>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
              onClick={handleManualContinue}
            >
              Pradėti treniruotę
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>
            <p className="text-lg text-blue-600 font-semibold mb-2">{step.type === "rest" || step.type === "rest_after" ? "Poilsis" : `Serija ${step.set}`}</p>
            <p className="text-sm text-gray-500 italic mb-2">{exercise.description}</p>
            <p className="font-semibold mb-4">{step.duration}</p>
            {secondsLeft > 0 && <p className="text-4xl font-bold mb-4">{secondsLeft} sek.</p>}
          </>
        )}

        {waitingForUser && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            onClick={handleManualContinue}
          >
            Tęsti
          </button>
        )}

        <button onClick={onClose} className="mt-4 text-red-500">Uždaryti</button>
      </div>
    </div>
  );
}