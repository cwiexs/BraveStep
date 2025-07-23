import { useEffect, useState, useRef } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw } from 'lucide-react';

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);
  const [paused, setPaused] = useState(false);
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
    if (phase === "intro" || paused) return;
    if (step.duration.includes("sek") || step.duration.includes("sec")) {
      setSecondsLeft(parseSeconds(step.duration));
      setPhase(step.type);
    } else {
      setWaitingForUser(true);
    }
  }, [currentExerciseIndex, currentStepIndex, phase, paused]);

  useEffect(() => {
    if (secondsLeft > 0 && !paused) {
      const interval = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
      if (!playedWarnings.includes(secondsLeft)) {
        if ([5,4,3,2,1].includes(secondsLeft)) {
          new Audio(`/${secondsLeft}.mp3`).play().catch(()=>{});
          setPlayedWarnings(prev => [...prev, secondsLeft]);
        }
      }
      return () => clearInterval(interval);
    } else if (secondsLeft === 0 && !waitingForUser && phase !== "intro") {
      handlePhaseComplete();
    }
  }, [secondsLeft, waitingForUser, phase, paused]);

  function handlePhaseComplete() {
    new Audio("/beep.mp3").play().catch(()=>{});
    if (currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setPlayedWarnings([]);
    } else if (currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      setPlayedWarnings([]);
    } else {
      alert("Treniruotė baigta!");
      onClose();
    }
  }

  function handleManualContinue() {
    if (phase === "intro") {
      setPhase("exercise");
      if (step.duration.includes("sek") || step.duration.includes("sec")) {
        setSecondsLeft(parseSeconds(step.duration));
        setWaitingForUser(false);
      } else {
        setWaitingForUser(true);
      }
    } else {
      setWaitingForUser(false);
      handlePhaseComplete();
    }
  }

  function getNextExerciseText() {
    if (currentExerciseIndex + 1 < day.exercises.length) {
      const nextExercise = day.exercises[currentExerciseIndex + 1];
      return nextExercise ? nextExercise.name : "Pabaiga";
    }
    return "Pabaiga";
  }

  function goToPrevious() {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevIndex);
      const prevExercise = day.exercises[prevIndex];
      setCurrentStepIndex(prevExercise.steps.length - 1);
    }
  }

  function goToNext() {
    if (currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    }
  }

  function restartCurrentStep() {
    if (step.duration.includes("sek") || step.duration.includes("sec")) {
      setSecondsLeft(parseSeconds(step.duration));
    }
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{exercise.name}</h2>
            {step.type === "exercise" && (
              <p className="text-lg font-medium text-gray-900 mb-2">
                {step.duration}, serija {step.set}
              </p>
            )}
            {(step.type === "rest" || step.type === "rest_after") && (
              <p className="text-lg font-medium text-gray-900 mb-2">
                Poilsis: {step.duration}
              </p>
            )}
            {secondsLeft > 0 && (
              <p className="text-4xl text-gray-900 font-bold mb-4">{secondsLeft} sek.</p>
            )}
            <p className="text-sm text-gray-900 italic mb-6">{exercise.description}</p>
            {(step.type === "rest" || step.type === "rest_after") && (
              <p className="text-sm text-gray-900 italic mt-2">
                🔜 Sekantis pratimas: {getNextExerciseText()}
              </p>
            )}


{waitingForUser && phase !== "intro" && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={handleManualContinue}
            >
              Atlikta
            </button>
          </div>
        )}



            <div className="flex justify-center items-center gap-4 mt-6">
  <button onClick={goToPrevious} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm">
    <SkipBack className="w-6 h-6 text-gray-800" />
  </button>
  <button onClick={() => setPaused(prev => !prev)} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm">
    {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
  </button>
  <button onClick={restartCurrentStep} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm">
    <RotateCcw className="w-6 h-6 text-gray-800" />
  </button>
  <button onClick={goToNext} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm">
    <SkipForward className="w-6 h-6 text-gray-800" />
  </button>
</div> 


            <div className="mt-4">
              <button onClick={onClose} className="text-sm text-red-500 hover:underline">
                Baigti sesiją
              </button>
            </div>
          </>
        )}

        
      </div>
    </div>
  );
}
