import { useEffect, useState } from "react";

export default function WorkoutPlayer({ workoutData, onClose }) {
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);

  const day = workoutData.days[currentDay];
  const exercise = day.exercises[currentExerciseIndex];
  const totalSets = parseInt(exercise.sets) || 1;
  const isFinalRestPhase = phase === "rest" && currentSet > totalSets;

  function parseSeconds(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  useEffect(() => {
    if (secondsLeft > 0) {
      const interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);

      if (!playedWarnings.includes(secondsLeft)) {
        switch (secondsLeft) {
          case 5:
            playWarning5();
            break;
          case 4:
            playWarning4();
            break;
          case 3:
            playWarning3();
            break;
          case 2:
            playWarning2();
            break;
          case 1:
            playWarning1();
            break;
          default:
            break;
        }
        setPlayedWarnings(prev => [...prev, secondsLeft]);
      }

      return () => clearInterval(interval);
    } else if (secondsLeft === 0 && phase !== "idle") {
      setPlayedWarnings([]);
      handlePhaseComplete();
    }
  }, [secondsLeft, phase]);

  useEffect(() => {
    if (phase === "idle" && currentExerciseIndex === 0 && currentSet === 1) {
      const isTimed = exercise.reps.includes("sekund");
      const duration = parseSeconds(exercise.reps);
      if (!isTimed || duration === 0) {
        setWaitingForUser(true);
      }
    }
  }, []);

  function playBeep() {
    const audio = new Audio("/beep.mp3");
    audio.play();
  }

  function playWarning5() {
    const audio = new Audio("/5.mp3");
    audio.play();
  }
  function playWarning4() {
    const audio = new Audio("/4.mp3");
    audio.play();
  }
  function playWarning3() {
    const audio = new Audio("/3.mp3");
    audio.play();
  }
  function playWarning2() {
    const audio = new Audio("/2.mp3");
    audio.play();
  }
  function playWarning1() {
    const audio = new Audio("/1.mp3");
    audio.play();
  }

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
    const restBetween = parseSeconds(exercise.restBetweenSets);
    const restAfter = parseSeconds(exercise.restAfterExercise);
    const isTimed = exercise.reps.includes("sekund");

    if (phase === "exercise") {
      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        startPhase(restBetween, "rest");
      } else {
        const nextIndex = currentExerciseIndex + 1;
        if (nextIndex < day.exercises.length) {
          setCurrentSet(1);
          setCurrentExerciseIndex(nextIndex);

          const nextExercise = day.exercises[nextIndex];
          const nextIsTimed = nextExercise.reps.includes("sekund");
          const nextDuration = parseSeconds(nextExercise.reps);

          if (restAfter > 0) {
            startPhase(restAfter, "rest");
          } else {
            if (!nextIsTimed || nextDuration === 0) {
              setWaitingForUser(true);
              setPhase("idle");
            } else {
              startPhase(nextDuration, "exercise");
            }
          }
        } else {
          alert("Treniruotė baigta!");
          onClose();
        }
      }
    } else if (phase === "rest") {
      const isTimed = exercise.reps.includes("sekund");
      const duration = isTimed ? parseSeconds(exercise.reps) : 0;
      if (isTimed && currentSet <= totalSets) {
        startPhase(duration, "exercise");
      } else {
        setWaitingForUser(true);
        setPhase("idle");
      }
    }
  }

  function handleManualStart() {
    const isTimed = exercise.reps.includes("sekund");
    const duration = isTimed ? parseSeconds(exercise.reps) : 0;

    if (isTimed) {
      startPhase(duration, "exercise");
    } else {
      const restBetween = parseSeconds(exercise.restBetweenSets);
      const restAfter = parseSeconds(exercise.restAfterExercise);

      if (currentSet < totalSets) {
        setCurrentSet(prev => prev + 1);
        startPhase(restBetween, "rest");
      } else {
        const nextIndex = currentExerciseIndex + 1;
        if (nextIndex < day.exercises.length) {
          setCurrentSet(1);
          setCurrentExerciseIndex(nextIndex);

          const nextExercise = day.exercises[nextIndex];
          const nextIsTimed = nextExercise.reps.includes("sekund");
          const nextDuration = parseSeconds(nextExercise.reps);

          if (restAfter > 0) {
            startPhase(restAfter, "rest");
          } else {
            if (!nextIsTimed || nextDuration === 0) {
              setWaitingForUser(true);
              setPhase("idle");
            } else {
              startPhase(nextDuration, "exercise");
            }
          }
        } else {
          alert("Treniruotė baigta!");
          onClose();
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        {phase === "rest" ? (
          <>
            <h2 className="text-xl font-bold mb-2">🧘‍♂️ Poilsis</h2>
            <p className="mb-2 text-gray-700 italic">
              Giliai įkvėpk... iškvėpk... Ramiai stovėk. Leisk kūnui pailsėti.
            </p>
            <p className="text-sm text-gray-600 italic mt-2">
              🔜 Sekantis pratimas: {
                isFinalRestPhase
                  ? (currentExerciseIndex + 1 < day.exercises.length
                      ? day.exercises[currentExerciseIndex + 1].name
                      : "Pabaiga")
                  : `${exercise.name} (serija ${Math.min(currentSet + 1, totalSets)} iš ${exercise.sets})`
              }
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">{exercise.name}</h2>
            <p className="mb-2">{exercise.description}</p>
          </>
        )}

        <p className="font-semibold mb-4">Serija {currentSet}/{exercise.sets}</p>
        {secondsLeft > 0 && (
          <p className="text-4xl font-bold mb-4">
            {phase === "rest" ? "Poilsis: " : ""}
            {secondsLeft} sek.
          </p>
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
