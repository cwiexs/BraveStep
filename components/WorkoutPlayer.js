import { useEffect, useState, useRef } from "react";

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState("intro"); // intro phase
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const wakeLockRef = useRef(null);

  const day = workoutData.days[currentDay];
  const exercise = day.exercises[currentExerciseIndex];

  function parseSeconds(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        wakeLockRef.current = lock;
        wakeLockRef.current.addEventListener("release", () => {
          console.log("🔕 Wake lock atleistas");
        });
        console.log("📱 Ekranas laikomas aktyvus");
      }).catch(err => {
        console.error("Wake Lock nepavyko:", err);
      });
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (secondsLeft > 0) {
      const interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);

      if (!playedWarnings.includes(secondsLeft)) {
        switch (secondsLeft) {
          case 5:
            playWarning5(); break;
          case 4:
            playWarning4(); break;
          case 3:
            playWarning3(); break;
          case 2:
            playWarning2(); break;
          case 1:
            playWarning1(); break;
        }
        setPlayedWarnings(prev => [...prev, secondsLeft]);
      }

      return () => clearInterval(interval);
    } else if (secondsLeft === 0 && phase !== "idle" && phase !== "intro") {
      setPlayedWarnings([]);
      handlePhaseComplete();
    }
  }, [secondsLeft, phase]);

  useEffect(() => {
    if (phase === "idle" && currentExerciseIndex === 0 && currentSet === 1) {
      const isTimed = exercise.reps.includes("sekund");
      const duration = parseSeconds(exercise.reps);
      if (!isTimed || duration === 0) setWaitingForUser(true);
    }
  }, []);

  function playBeep() {
    new Audio("/beep.mp3").play();
  }
  function playWarning1() { new Audio("/1.mp3").play(); }
  function playWarning2() { new Audio("/2.mp3").play(); }
  function playWarning3() { new Audio("/3.mp3").play(); }
  function playWarning4() { new Audio("/4.mp3").play(); }
  function playWarning5() { new Audio("/5.mp3").play(); }

  function startPhase(duration, nextPhase) {
    setWaitingForUser(false);
    setPlayedWarnings([]);
    if (duration > 0) {
      setSecondsLeft(duration);
      setPhase(nextPhase);
    } else {
      if (nextPhase === "exercise") {
        setPhase("idle");
        setWaitingForUser(true);
      } else if (nextPhase === "rest") {
        setPhase("rest");
        setSecondsLeft(0);
      }
    }
  }

  function handlePhaseComplete() {
    playBeep();
    const totalSets = parseInt(exercise.sets) || 1;
    const restBetween = parseSeconds(exercise.restBetweenSets);
    const restAfter = parseSeconds(exercise.restAfterExercise);
    const isTimed = exercise.reps.includes("sekund");

    if (phase === "exercise") {
      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        startPhase(restBetween, "rest");
      } else {
        if (restAfter > 0) {
          startPhase(restAfter, "rest");
        } else {
          goToNextExercise();
        }
      }
    } else if (phase === "rest") {
      if (currentSet >= parseInt(exercise.sets)) {
        goToNextExercise();
      } else {
        const duration = isTimed ? parseSeconds(exercise.reps) : 0;
        if (isTimed && currentSet <= parseInt(exercise.sets)) {
          startPhase(duration, "exercise");
        } else {
          setWaitingForUser(true);
          setPhase("idle");
        }
      }
    }
  }

  function goToNextExercise() {
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex < day.exercises.length) {
      setCurrentSet(1);
      setCurrentExerciseIndex(nextIndex);

      const nextExercise = day.exercises[nextIndex];
      const nextIsTimed = nextExercise.reps.includes("sekund");
      const nextDuration = parseSeconds(nextExercise.reps);

      if (!nextIsTimed || nextDuration === 0) {
        setWaitingForUser(true);
        setPhase("idle");
      } else {
        startPhase(nextDuration, "exercise");
      }
    } else {
      alert("Treniruotė baigta!");
      onClose();
    }
  }

  function handleIntroContinue() {
    const isTimed = exercise.reps.includes("sekund");
    const duration = isTimed ? parseSeconds(exercise.reps) : 0;
    if (isTimed) {
      startPhase(duration, "exercise");
    } else {
      setPhase("idle");
      setWaitingForUser(true);
    }
  }

  function handleManualStart() {
    if (!audioUnlocked) {
      const unlock = new Audio("/silance.mp3");
      unlock.play().catch(() => {});
      setAudioUnlocked(true);
    }

    const isTimed = exercise.reps.includes("sekund");
    const duration = isTimed ? parseSeconds(exercise.reps) : 0;

    if (isTimed) {
      startPhase(duration, "exercise");
    } else {
      if (currentSet < parseInt(exercise.sets)) {
        setCurrentSet(prev => prev + 1);
        startPhase(parseSeconds(exercise.restBetweenSets), "rest");
      } else {
        if (parseSeconds(exercise.restAfterExercise) > 0) {
          startPhase(parseSeconds(exercise.restAfterExercise), "rest");
        } else {
          goToNextExercise();
        }
      }
    }
  }

  const nextExerciseText = () => {
    if (phase === "rest") {
      if (currentSet < parseInt(exercise.sets)) {
        return `${exercise.name} (serija ${currentSet + 1} iš ${exercise.sets})`;
      } else {
        const next = day.exercises[currentExerciseIndex + 1];
        return next ? `${next.name} (serija 1 iš ${next.sets})` : "Pabaiga";
      }
    }
    return "";
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
              <p><strong>Kartojimai:</strong> {exercise.reps}</p>
              <p><strong>Serijų skaičius:</strong> {exercise.sets}</p>
            </div>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
              onClick={handleIntroContinue}
            >
              Pradėti treniruotę
            </button>
          </>
        ) : phase === "rest" ? (
          <>
            <h2 className="text-xl font-bold mb-2">🧘‍♂️ Poilsis</h2>
            <p className="mb-2 text-gray-700 italic">
              Giliai įkvėpk... iškvėpk... Ramiai stovėk. Leisk kūnui pailsėti.
            </p>
            <p className="text-sm text-gray-600 italic mt-2">
              🔜 Sekantis pratimas: {nextExerciseText()}
            </p>
            <p className="text-4xl font-bold mb-4">
              Poilsis: {secondsLeft} sek.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>
            <p className="text-lg text-blue-600 font-semibold mb-2">Atlikite: {exercise.reps}</p>
            <p className="text-sm text-gray-500 italic mb-2">{exercise.description}</p>
            <p className="font-semibold mb-4">
              Serija {currentSet}/{exercise.sets}
            </p>
            {secondsLeft > 0 && (
              <p className="text-4xl font-bold mb-4">{secondsLeft} sek.</p>
            )}
          </>
        )}

        {waitingForUser && (
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
