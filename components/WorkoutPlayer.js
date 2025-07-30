// Atnaujinta versija su treniruotės įvertinimo langeliu
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
  const handlePhaseRef = useRef(false);
  const router = useRouter();

  const day = workoutData.days[currentDay];
  const exercise = day.exercises[currentExerciseIndex];
  const step = exercise.steps[currentStepIndex];

  

  async function submitFeedback() {
    await fetch('/api/complete-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: workoutData.id,
        difficultyRating: rating,
        userComment: comment
      })
    });
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
          <h2 className="text-xl font-bold mb-2">💬 {workoutData?.days[0]?.motivationEnd || 'Puikiai padirbėta!'}</h2>
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

  // Debug: išvesk visą struktūrą į konsolę paleidžiant
  useEffect(() => {
    console.log(">>> PILNA workoutData struktūra:", workoutData);
    workoutData.days.forEach((day, i) => {
      day.exercises.forEach((ex, j) => {
        console.log(`>>> Day ${i} Ex ${j} '${ex.name}':`);
        ex.steps.forEach((step, k) => {
          console.log(`    Step ${k}: type='${step.type}', set='${step.set}', duration='${step.duration}'`);
        });
      });
    });
  }, [workoutData]);

  // Debug: rodyk einamą žingsnį kai keičiasi step
  useEffect(() => {
    console.log(`>>> DABARTINIS Step: [Day ${currentDay}] [Exercise ${currentExerciseIndex}] [Step ${currentStepIndex}]`);
    console.log(">>> Žingsnio tipas:", step.type, "Serija:", step.set, "Trukmė:", step.duration);
  }, [currentDay, currentExerciseIndex, currentStepIndex, step]);

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

  // Keičiam laiką TIK kai keičiasi pratimas ar stepas, BET NE dėl pauzės
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === "intro") {
      setSecondsLeft(0);
      setWaitingForUser(false);
      return;
    }

    // Jei reikia laikmačio (trukmė sekundėmis)
    if (step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) {
      setSecondsLeft(prev => {
        // Jei keičiasi žingsnis (ne dėl pauzės), iš naujo
        if (!paused) return parseSeconds(step.duration);
        // Jei pauzė, nieko nekeičiam
        return prev;
      });
      setPhase(step.type);
      setWaitingForUser(false);
      setPlayedWarnings([]);
      console.log(">>> Paleidžiamas laikmatis:", parseSeconds(step.duration), "sek.");
    } else {
      setSecondsLeft(0);
      setWaitingForUser(true);
      setPlayedWarnings([]);
      console.log(">>> Laukiama naudotojo paspaudimo");
    }
    // eslint-disable-next-line
  }, [currentExerciseIndex, currentStepIndex, phase]);

  // Laikmatis
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (secondsLeft > 0 && !paused) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);

      if ([5,4,3,2,1].includes(secondsLeft) && !playedWarnings.includes(secondsLeft)) {
        new Audio(`/${secondsLeft}.mp3`).play().catch(()=>{});
        setPlayedWarnings(prev => [...prev, secondsLeft]);
      }

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else if (secondsLeft === 0 && !waitingForUser && phase !== "intro") {
      handlePhaseComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [secondsLeft, waitingForUser, phase, paused]);

    if (timerRef.current) clearInterval(timerRef.current);
    new Audio("/beep.mp3").play().catch(()=>{});
    if (currentStepIndex + 1 < exercise.steps.length) {
      console.log(`>>> handlePhaseComplete: Peršokama į kitą step (${currentStepIndex + 1})`);
      setCurrentStepIndex(prev => prev + 1);
      setPlayedWarnings([]);
    } else if (currentExerciseIndex + 1 < day.exercises.length) {
      console.log(">>> handlePhaseComplete: Baigėsi pratimo steps, peršokama į kitą pratimą");
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      setPlayedWarnings([]);
    } else {
      console.log(">>> handlePhaseComplete: Treniruotė baigta!");
       setShowFeedback(true);

    }
  }
  


  function handleManualContinue() {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === "intro") {
      setPhase("exercise");
      if (step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) {
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
  new Audio("/beep.mp3").play().catch(()=>{});

  if (currentStepIndex + 1 < exercise.steps.length) {
    setCurrentStepIndex(prev => prev + 1);
    setPlayedWarnings([]);
  } else if (currentExerciseIndex + 1 < day.exercises.length) {
    setCurrentExerciseIndex(prev => prev + 1);
    setCurrentStepIndex(0);
    setPlayedWarnings([]);
  } else {
    console.log(">>> handlePhaseComplete: Treniruotė baigta!");
    setShowFeedback(true);
  }
}

  function getNextExerciseText() {
    // Kurioje serijoje esame?
    const allExerciseSteps = exercise.steps.filter(s => s.type === "exercise");
    const currentExerciseStepIdx = exercise.steps
      .filter((s, idx) => idx <= currentStepIndex)
      .filter(s => s.type === "exercise").length - 1;

    // Jei dar yra likusių serijų – rodyti sekančią seriją (to paties pratimo)
    if (
      step.type === "rest" &&
      currentExerciseStepIdx + 1 < allExerciseSteps.length
    ) {
      // Sekanti serija to paties pratimo
      const nextSet = allExerciseSteps[currentExerciseStepIdx + 1].set;
      return `${exercise.name} serija ${nextSet}/${allExerciseSteps.length}`;
    }

    // Jei jau visos serijos baigtos – rodomas sekantis pratimas
    if (currentExerciseIndex + 1 < day.exercises.length) {
      const nextExercise = day.exercises[currentExerciseIndex + 1];
      return nextExercise ? nextExercise.name : "Pabaiga";
    }
    return "Pabaiga";
  }

  function goToPrevious() {
    if (timerRef.current) clearInterval(timerRef.current);

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
    if (timerRef.current) clearInterval(timerRef.current);

    if (currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    }
  }

  function restartCurrentStep() {
    if (timerRef.current) clearInterval(timerRef.current);

    if (step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) {
      setSecondsLeft(parseSeconds(step.duration));
    }
  }

  // Automatiškai išvalom timerį kai komponentas užsidaro
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        {phase === "intro" ? (
          <>
            <h2 className="text-2xl font-bold mb-4">💡 Motyvacija</h2>
            <p className="mb-4 text-gray-800 whitespace-pre-wrap">{workoutData.days[0]?.motivationStart}</p>
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
            
            {/* Rodome skirtingą tekstą pagal step.type */}
            {step.type === "exercise" && (
              <p className="text-lg font-medium text-gray-900 mb-2">
                {step.duration} - serija {step.set}/{exercise.steps.filter(s => s.type === "exercise").length}
              </p>
            )}

            {(step.type === "rest" || step.type === "rest_after") && (
              <p className="text-lg font-medium text-blue-900 mb-2">
                Poilsis: {step.duration}
              </p>
            )}

            {/* Laikmatis rodomas visada, kai yra laikas */}
            {(step.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) && (
              <p className="text-4xl text-gray-900 font-bold mb-4">
                {secondsLeft > 0 ? `${secondsLeft} sek.` : null}
                {paused && <span className="block text-xl text-red-600 mt-2">Pauzė</span>}
              </p>
            )}

            {/* Pratimo aprašymas visada */}
            <p className="text-sm text-gray-500 italic mb-6">{exercise.description}</p>

            {/* Tik kai laukiam vartotojo, rodom „Atlikta“ */}
            {waitingForUser && step.type === "exercise" && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                  onClick={handleManualContinue}
                >
                  Atlikta
                </button>
              </div>
            )}

            {/* Sekantis pratimas rodomas tik per poilsį */}
            {(step.type === "rest" || step.type === "rest_after") && (
              <p className="text-sm text-gray-500 italic mt-2">
                🔜 Sekantis pratimas: {getNextExerciseText()}
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

