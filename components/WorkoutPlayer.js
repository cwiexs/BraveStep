import { useEffect, useState, useRef } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/router';

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);
  const [paused, setPaused] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const wakeLockRef = useRef(null);
  const timerRef = useRef(null);
  const router = useRouter();

  // SAUGUS gavimas
  const day = workoutData?.days?.[currentDay];
  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

// 1. Tik 'useEffect' pakeičia state!
useEffect(() => {
  if ((!day || !exercise || !step) && !showFeedback && phase !== "intro") {
    setShowFeedback(true);
  }
  // eslint-disable-next-line
}, [day, exercise, step, showFeedback, phase]);

// 2. O renderio metu – tiesiog nieko nerenderinam:
if ((!day || !exercise || !step) && !showFeedback && phase !== "intro") {
  return null;
}



  async function submitFeedback() {
    try {
      await fetch('/api/complete-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: workoutData.id,
          difficultyRating: rating,
          userComment: comment
        })
      });
    } catch (e) {}
    setSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false);
      onClose();
    }, 1500);
  }

  if (showFeedback) {
    const emojis = ['😣', '😟', '😌', '😄', '🔥'];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-xl font-bold mb-2">💬 {workoutData?.days?.[0]?.motivationEnd || 'Puikiai padirbėta!'}</h2>
          <p className="text-sm text-gray-600 mb-4">Kaip įvertintum treniruotės sunkumą?</p>

          <div className="flex justify-center gap-2 mb-4">
            {emojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                className={`text-3xl ${rating === i + 1 ? 'scale-125' : ''}`}
              >{emoji}</button>
            ))}
          </div>

          <textarea
            placeholder="Tavo komentaras apie šią treniruotę..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            rows={3}
          />

          <button
            onClick={submitFeedback}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Baigti treniruotę
          </button>

          {submitted && <p className="text-green-600 mt-2">Ačiū už įvertinimą!</p>}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        wakeLockRef.current = lock;
      }).catch(() => {});
    }
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  function parseSeconds(text) {
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === "intro" || !step) {
      setSecondsLeft(0);
      setWaitingForUser(false);
      return;
    }
    if (step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) {
      setSecondsLeft(parseSeconds(step.duration));
      setWaitingForUser(false);
      setPlayedWarnings([]);
    } else {
      setSecondsLeft(0);
      setWaitingForUser(true);
      setPlayedWarnings([]);
    }
    // eslint-disable-next-line
  }, [currentExerciseIndex, currentStepIndex, phase, step]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (secondsLeft > 0 && !paused) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); }
    } else if (secondsLeft === 0 && !waitingForUser && phase !== "intro" && step) {
      handlePhaseComplete();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
    // eslint-disable-next-line
  }, [secondsLeft, waitingForUser, phase, paused, step]);

  function handleManualContinue() {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === "intro") {
      setPhase("exercise");
      if (step && step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) {
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

  function handlePhaseComplete() {
    if (timerRef.current) clearInterval(timerRef.current);
    try { new Audio("/beep.mp3").play().catch(()=>{}); } catch {}

    if (step && exercise && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setPlayedWarnings([]);
    } else if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      setPlayedWarnings([]);
    } else {
      setShowFeedback(true);
    }
  }

  function goToPrevious() {
    if (timerRef.current) clearInterval(timerRef.current);

    if (step && currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (exercise && currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevIndex);
      const prevExercise = day?.exercises?.[prevIndex];
      setCurrentStepIndex(prevExercise?.steps?.length ? prevExercise.steps.length - 1 : 0);
    }
  }
  function goToNext() {
    if (timerRef.current) clearInterval(timerRef.current);

    if (step && exercise && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    }
  }
  function restartCurrentStep() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (step && step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) {
      setSecondsLeft(parseSeconds(step.duration));
    }
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        {phase === "intro" ? (
          <>
            <h2 className="text-2xl font-bold mb-4">💡 Motyvacija</h2>
            <p className="mb-4 text-gray-800 whitespace-pre-wrap">{workoutData?.days?.[0]?.motivationStart}</p>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
              onClick={handleManualContinue}
            >
              Pradėti treniruotę
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{exercise?.name || "Pratimas"}</h2>
            {step?.type === "exercise" && (
              <p className="text-lg font-medium text-gray-900 mb-2">
                {step.duration} - serija {step.set}/{exercise?.steps?.filter(s => s.type === "exercise").length}
              </p>
            )}
            {(step?.type === "rest" || step?.type === "rest_after") && (
              <p className="text-lg font-medium text-blue-900 mb-2">
                Poilsis: {step.duration}
              </p>
            )}
            {(step?.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) && (
              <p className="text-4xl text-gray-900 font-bold mb-4">
                {secondsLeft > 0 ? `${secondsLeft} sek.` : null}
                {paused && <span className="block text-xl text-red-600 mt-2">Pauzė</span>}
              </p>
            )}
            <p className="text-sm text-gray-500 italic mb-6">{exercise?.description}</p>
            {waitingForUser && step?.type === "exercise" && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                  onClick={handleManualContinue}
                >
                  Atlikta
                </button>
              </div>
            )}
            {(step?.type === "rest" || step?.type === "rest_after") && (
              <p className="text-sm text-gray-500 italic mt-2">
                🔜 Sekantis pratimas: {
                  (exercise && step) ? (
                    (() => {
                      // Kurioje serijoje esame?
                      const allExerciseSteps = exercise.steps.filter(s => s.type === "exercise");
                      const currentExerciseStepIdx = exercise.steps
                        .filter((s, idx) => idx <= currentStepIndex)
                        .filter(s => s.type === "exercise").length - 1;
                      if (
                        step.type === "rest" &&
                        currentExerciseStepIdx + 1 < allExerciseSteps.length
                      ) {
                        const nextSet = allExerciseSteps[currentExerciseStepIdx + 1].set;
                        return `${exercise.name} serija ${nextSet}/${allExerciseSteps.length}`;
                      }
                      if (currentExerciseIndex + 1 < day.exercises.length) {
                        const nextExercise = day.exercises[currentExerciseIndex + 1];
                        return nextExercise ? nextExercise.name : "Pabaiga";
                      }
                      return "Pabaiga";
                    })()
                  ) : "Pabaiga"
                }
              </p>
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
