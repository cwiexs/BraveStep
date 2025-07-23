// Atnaujintas WorkoutPlayer.js, kad veiktų su steps[] vietoj reps/sets/rest logikos

import { useEffect, useState, useRef } from "react";

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);
  const wakeLockRef = useRef(null);

  const day = workoutData.days[currentDayIndex];
  const exercise = day.exercises[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        wakeLockRef.current = lock;
        wakeLockRef.current.addEventListener("release", () => {
          console.log("🔕 Wake lock released");
        });
      }).catch(console.error);
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  useEffect(() => {
    if (!step) return;
    if (step.duration?.includes("sek") || step.duration?.includes("sec")) {
      const duration = parseSeconds(step.duration);
      if (duration > 0) {
        setPhase("active");
        setSecondsLeft(duration);
      } else {
        setPhase("idle");
        setWaitingForUser(true);
      }
    } else {
      setPhase("idle");
      setWaitingForUser(true);
    }
  }, [currentExerciseIndex, currentStepIndex]);

  useEffect(() => {
    if (secondsLeft > 0) {
      const interval = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);

      if (!playedWarnings.includes(secondsLeft)) {
        if (secondsLeft <= 5 && secondsLeft > 0) {
          new Audio(`/${secondsLeft}.mp3`).play();
          setPlayedWarnings(prev => [...prev, secondsLeft]);
        }
      }

      return () => clearInterval(interval);
    } else if (secondsLeft === 0 && phase === "active") {
      setPlayedWarnings([]);
      goToNextStep();
    }
  }, [secondsLeft, phase]);

  function parseSeconds(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function goToNextStep() {
    const steps = exercise.steps;
    if (currentStepIndex + 1 < steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      if (currentExerciseIndex + 1 < day.exercises.length) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentStepIndex(0);
      } else {
        alert("Treniruotė baigta!");
        onClose();
      }
    }
  }

  function handleManualStart() {
    if (!audioUnlocked) {
      new Audio("/silance.mp3").play().catch(() => {});
      setAudioUnlocked(true);
    }
    goToNextStep();
  }

  const nextStepText = () => {
    const steps = exercise.steps;
    const next = steps[currentStepIndex + 1];
    if (next) {
      if (next.type === "exercise") return `${exercise.name} (set ${next.set})`;
      if (next.type === "rest") return `Poilsis: ${next.duration}`;
      if (next.type === "rest_after") {
        const nextExercise = day.exercises[currentExerciseIndex + 1];
        return nextExercise ? `Kitas pratimas: ${nextExercise.name}` : "Pabaiga";
      }
    } else {
      const nextExercise = day.exercises[currentExerciseIndex + 1];
      return nextExercise ? `Kitas pratimas: ${nextExercise.name}` : "Pabaiga";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        {phase === "intro" ? (
          <>
            <h2 className="text-2xl font-bold mb-4">💡 Motyvacija</h2>
            <p className="mb-4 text-gray-800 whitespace-pre-wrap">{workoutData.introduction}</p>
            <div className="mb-6 text-left text-sm text-gray-600 border-l-4 border-blue-300 pl-4">
              <p><strong>Pirmas pratimas:</strong> {exercise.name}</p>
            </div>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
              onClick={() => setPhase("active")}
            >
              Pradėti treniruotę
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>
            <p className="text-lg text-blue-600 font-semibold mb-2">{step.type === "exercise" ? `Atlikite seriją ${step.set}` : step.type === "rest" ? "Poilsis" : "Poilsis prieš kitą pratimą"}</p>
            <p className="text-sm text-gray-500 italic mb-2">{exercise.description}</p>
            <p className="font-semibold mb-4">{step.duration}</p>
            {secondsLeft > 0 && <p className="text-4xl font-bold mb-4">{secondsLeft} sek.</p>}
          </>
        )}

        {waitingForUser && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            onClick={handleManualStart}
          >
            Tęsti
          </button>
        )}

        <p className="text-sm text-gray-600 italic mt-2">🔜 {nextStepText()}</p>

        <button onClick={onClose} className="mt-4 text-red-500">Uždaryti</button>
      </div>
    </div>
  );
}
