import { useEffect, useState, useRef } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/router';

// Pagrindinis treniruotės grotuvo komponentas
export default function WorkoutPlayer({ workoutData, planId, onClose }) {
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

  // LOCK mechanizmas – garantuoja, kad žingsnis bus užbaigtas TIK VIENĄ KARTĄ
  const [stepFinished, setStepFinished] = useState(false);

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

  // --- Kiekvieno žingsnio laikmatis ---
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

  // --- LOCK RESETOJIMAS --- 
  // Kaskart keičiant žingsnį ar pratimą, leidžiame užbaigti sekantį žingsnį (t.y. stepFinished = false)
  useEffect(() => {
    setStepFinished(false);
  }, [currentStepIndex, currentExerciseIndex]);

  // --- Tiksintis laikrodis ---
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase !== "exercise") return;

    if (secondsLeft > 0 && !paused) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); }
    }
    // Jei pasibaigė laikas ir laukiamas žingsnis – kviečiam fazės pabaigą TIK VIENĄ KARTĄ
    else if (secondsLeft === 0 && !waitingForUser && step && !stepFinished) {
      setStepFinished(true);
      handlePhaseComplete();
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, [secondsLeft, waitingForUser, phase, paused, step, stepFinished]);

  // --- Rankinis mygtukas ---
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
    }
    else if (phase === "exercise") {
      setWaitingForUser(false);
      handlePhaseComplete();
    }
    else if (phase === "summary") {
      onClose();
    }
  }

  // --- Baigiamas žingsnis/pratimas ---
  function handlePhaseComplete() {
    if (timerRef.current) clearInterval(timerRef.current);

    try { new Audio("/beep.mp3").play().catch(()=>{}); } catch {}

    // Patikrinam ar turime kitą žingsnį tame pačiame pratime
    if (exercise && step && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setPlayedWarnings([]);
      return;
    }

    // Jei visus žingsnius jau perėjom (pvz., ir rest_after buvo parodytas)
    // Patikrinam ar yra sekantis pratimas tame pačiame dienos plane
    if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      setPlayedWarnings([]);
      return;
    }

    // Jei nėra daugiau pratimų – pereinam į summary
    setPhase("summary");
  }

  // --- Navigacija ---
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

  async function submitFeedback() {
    try {
      await fetch('/api/complete-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          difficultyRating: rating,
          userComment: comment
        })
      });
    } catch (e) {}
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  // --- Intro ---
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

  // --- Exercise ---
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

  // --- Summary ---
  if (phase === "summary") {
    const options = [
      { value: 1, label: '😣', text: 'Per sunku' },
      { value: 2, label: '😟', text: 'Šiek tiek sunku' },
      { value: 3, label: '😌', text: 'Tobulas balansas' },
      { value: 4, label: '🙂', text: 'Šiek tiek lengva' },
      { value: 5, label: '😄', text: 'Per lengva' },
    ];
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-2">🎉 Sveikiname, treniruotė baigta!</h2>
          <p className="mb-4 text-gray-800 whitespace-pre-wrap">
            {workoutData?.days?.[0]?.motivationEnd || "Ačiū, kad sportavai!"}
          </p>

          {/* Papildyta rekomendacijomis */}
          {workoutData?.days?.[0]?.waterRecommendation && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900 mb-3">
              💧 {workoutData.days[0].waterRecommendation}
            </div>
          )}
          {workoutData?.days?.[0]?.outdoorSuggestion && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-900 mb-3">
              🌿 {workoutData.days[0].outdoorSuggestion}
            </div>
          )}

          <p className="text-sm text-gray-600 mb-2 font-semibold">Kaip įvertintum treniruotės sunkumą?</p>
          <div className="flex justify-center gap-2 mb-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRating(opt.value)}
                className={`text-3xl p-1 rounded-full border-2 
                  ${rating === opt.value ? 'border-green-500 bg-green-50' : 'border-transparent'}
                  hover:border-green-400`}
                type="button"
                title={opt.text}
              >{opt.label}</button>
            ))}
          </div>
          <div className="flex justify-center gap-2 mb-4">
            {options.map((opt) => (
              <span key={opt.value} className={`text-xs ${rating === opt.value ? 'font-bold text-green-700' : 'text-gray-400'}`}>
                {opt.text}
              </span>
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

  return null;
}
