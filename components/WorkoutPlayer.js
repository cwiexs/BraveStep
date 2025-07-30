import { useEffect, useState, useRef } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/router';

// Pagrindinis treniruotės grotuvo komponentas
export default function WorkoutPlayer({ workoutData, onClose }) {
  // --- Būsenos ir valdymo kintamieji ---
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // "phase" – nurodo kurioje ciklo dalyje esame: intro, exercise ar summary
  const [phase, setPhase] = useState("intro");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);
  const [paused, setPaused] = useState(false);

  // Atsiliepimo (feedback) dalis summary lange
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Kiti pagalbiniai kintamieji ir nuorodos
  const wakeLockRef = useRef(null);
  const timerRef = useRef(null);
  const router = useRouter();

  // --- Saugi treniruotės eigos informacijos gavimo logika ---
  const day = workoutData?.days?.[currentDay];
  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  // --- Užrakinam ekraną nuo užmigimo treniruotės metu (jei palaiko naršyklė) ---
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

  // --- Pagalbinė funkcija sekundėms iš tekstinės trukmės išgauti ---
  function parseSeconds(text) {
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // --- Kiekvieno žingsnio laikmatis, įsijungia priklausomai nuo tipo ir trukmės ---
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase !== "exercise" || !step) {
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
  }, [currentExerciseIndex, currentStepIndex, phase, step]);

  // --- Tiksintis laikrodis (kai rodomas laikmatis) ---
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase !== "exercise") return;

    if (secondsLeft > 0 && !paused) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); }
    } else if (secondsLeft === 0 && !waitingForUser && step) {
      handlePhaseComplete();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, [secondsLeft, waitingForUser, phase, paused, step]);

  // --- Rankinis mygtukas (Pradėti treniruotę, Atlikta, Baigti treniruotę) ---
  function handleManualContinue() {
    if (timerRef.current) clearInterval(timerRef.current);

    // Pradinis motyvacinis langas → treniruotės eiga
    if (phase === "intro") {
      setPhase("exercise");
      if (step && step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) {
        setSecondsLeft(parseSeconds(step.duration));
        setWaitingForUser(false);
      } else {
        setWaitingForUser(true);
      }
    }
    // Treniruotės žingsnis atliktas → pereinam į kitą arba į summary
    else if (phase === "exercise") {
      setWaitingForUser(false);
      handlePhaseComplete();
    }
    // Pabaigos langas uždaromas
    else if (phase === "summary") {
      onClose();
    }
  }

  // --- Kai užbaigiamas žingsnis/pratimas arba visa treniruotė ---
  function handlePhaseComplete() {
    if (timerRef.current) clearInterval(timerRef.current);
    try { new Audio("/beep.mp3").play().catch(()=>{}); } catch {}

    // Kitas žingsnis
    if (step && exercise && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setPlayedWarnings([]);
    }
    // Kitas pratimas
    else if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      setPlayedWarnings([]);
    }
    // Viskas baigta – pereinam į pabaigos langą
    else {
      setPhase("summary");
    }
  }

  // --- Navigacijos mygtukai atgal/pirmyn/restart ---
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

  // --- Išvalome laikmatį kai komponentas pašalinamas ---
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, []);

  // --- Pabaigos lango (summary) feedback funkcionalumas ---
  async function submitFeedback() {
    try {
      // Siunčiam į backend plan ID, įvertinimą ir komentarą
      await fetch('/api/complete-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: workoutData.id,
          difficultyRating: rating,
          userComment: comment
        })
      });
      // JEI reikia – antras request statusui atnaujinti (jei backend nepadaro automatiškai)
      // await fetch('/api/update-plan-status', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ planId: workoutData.id, status: 'completed' })
      // });
    } catch (e) {}
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  // --- Motyvacinis pradžios langas ---
  if (phase === "intro") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-4">💡 Motyvacija</h2>
          <p className="mb-4 text-gray-800 whitespace-pre-wrap">
            {workoutData?.days?.[0]?.motivationStart}
          </p>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
            onClick={handleManualContinue}
          >
            Pradėti treniruotę
          </button>
        </div>
      </div>
    )
  }

  // --- Treniruotės žingsnių (pratimų) eiga ---
  if (phase === "exercise") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
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
        </div>
      </div>
    );
  }

  // --- Pabaigos (summary) langas su įvertinimu ir komentaru ---
  if (phase === "summary") {
    const emojis = ['😣', '😟', '😌', '😄', '🔥'];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-2">🎉 Sveikiname, treniruotė baigta!</h2>
          <p className="mb-4 text-gray-800 whitespace-pre-wrap">
            {workoutData?.days?.[0]?.motivationEnd || "Ačiū, kad sportavai!"}
          </p>
          <p className="text-sm text-gray-600 mb-2">Kaip įvertintum treniruotę?</p>
          <div className="flex justify-center gap-2 mb-4">
            {emojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                className={`text-3xl ${rating === i + 1 ? 'scale-125' : ''}`}
                type="button"
              >{emoji}</button>
            ))}
          </div>
          <textarea
            placeholder="Tavo komentaras apie treniruotę..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            rows={3}
          />
          <button
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            onClick={submitFeedback}
            disabled={submitted}
          >
            Baigti treniruotę
          </button>
          {submitted && <p className="text-green-600 mt-2">Ačiū už įvertinimą!</p>}
        </div>
      </div>
    )
  }

  // --- Klaidų atvejis: jei nėra fazės (neturėtų nutikti) ---
  return null;
}
