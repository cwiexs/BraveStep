import { useEffect, useState, useRef } from "react";

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

  // Saugiai gauname einamą žingsnį
  const day = workoutData?.days?.[currentDay];
  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  // Saugiklis – jei kažko trūksta, tiesiog rodom apibendrinimą
  if ((!day || !exercise || !step) && !showFeedback && phase !== "intro") {
    setShowFeedback(true);
  }

  // Submit feedback įrašymas
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

  // FEEDBACK LANGAS
  if (showFeedback) {
    const emojis = ['😣', '😟', '😌', '😄', '🔥'];
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}>
        <div style={{
          background: 'white', borderRadius: 12, maxWidth: 380, padding: 24, textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
            {workoutData?.days?.[0]?.motivationEnd || 'Puikiai padirbėta!'}
          </h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
            Kaip įvertintum treniruotės sunkumą?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {emojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                style={{
                  fontSize: 32,
                  transform: rating === i + 1 ? 'scale(1.3)' : 'none',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >{emoji}</button>
            ))}
          </div>
          <textarea
            placeholder="Tavo komentaras apie šią treniruotę..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd', marginBottom: 16 }}
            rows={3}
          />
          <button
            onClick={submitFeedback}
            style={{
              background: '#059669', color: 'white', padding: '8px 28px',
              borderRadius: 6, fontWeight: 'bold', border: 'none', cursor: 'pointer'
            }}
          >
            Baigti treniruotę
          </button>
          {submitted && <p style={{ color: '#059669', marginTop: 10 }}>Ačiū už įvertinimą!</p>}
        </div>
      </div>
    );
  }

  // Užrakinam ekraną nuo užmigimo (jei palaiko naršyklė)
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

  // Paleidžiam laikmatį kai reikia
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

  // Tikrasis laikmatis
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

    // Jei dar yra žingsnių
    if (step && exercise && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setPlayedWarnings([]);
    }
    // Jei dar yra pratimų
    else if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      setPlayedWarnings([]);
    }
    // Baigėsi visi žingsniai ir pratimai
    else {
      setShowFeedback(true);
    }
  }

  // Valdymas – atgal, pirmyn ir restart
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

  // Išvalom timerį kai užsidaro
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); }
  }, []);

  // Paprastas UI, jokių papildomų dekoracijų
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'white', borderRadius: 12, maxWidth: 400, width: '100%', padding: 24, textAlign: 'center'
      }}>
        {phase === "intro" ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Motyvacija</h2>
            <p style={{ marginBottom: 20, color: '#333', whiteSpace: 'pre-wrap' }}>
              {workoutData?.days?.[0]?.motivationStart || ""}
            </p>
            <button
              style={{
                background: '#059669', color: 'white', padding: '10px 36px',
                borderRadius: 7, fontWeight: 'bold', border: 'none', cursor: 'pointer'
              }}
              onClick={handleManualContinue}
            >
              Pradėti treniruotę
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 6 }}>
              {exercise?.name || "Pratimas"}
            </h2>
            {step?.type === "exercise" && (
              <p style={{ fontSize: 16, fontWeight: '500', marginBottom: 6 }}>
                {step.duration} - serija {step.set}/{exercise?.steps?.filter(s => s.type === "exercise").length}
              </p>
            )}
            {(step?.type === "rest" || step?.type === "rest_after") && (
              <p style={{ fontSize: 16, fontWeight: '500', color: '#155e75', marginBottom: 6 }}>
                Poilsis: {step.duration}
              </p>
            )}
            {(step?.duration && (step.duration.includes("sek") || step.duration.includes("sec"))) && (
              <p style={{
                fontSize: 38, fontWeight: 'bold', color: '#222', marginBottom: 10
              }}>
                {secondsLeft > 0 ? `${secondsLeft} sek.` : null}
                {paused && <span style={{ display: 'block', fontSize: 18, color: '#d90000', marginTop: 4 }}>Pauzė</span>}
              </p>
            )}
            <p style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 18 }}>
              {exercise?.description}
            </p>
            {waitingForUser && step?.type === "exercise" && (
              <div style={{ margin: '18px 0' }}>
                <button
                  style={{
                    background: '#2563eb', color: 'white', padding: '8px 24px',
                    borderRadius: 6, fontWeight: 'bold', border: 'none', cursor: 'pointer'
                  }}
                  onClick={handleManualContinue}
                >
                  Atlikta
                </button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
              <button onClick={goToPrevious}>⏮️</button>
              <button onClick={() => setPaused(p => !p)}>{paused ? "▶️" : "⏸️"}</button>
              <button onClick={restartCurrentStep}>🔄</button>
              <button onClick={goToNext}>⏭️</button>
            </div>
            <div style={{ marginTop: 18 }}>
              <button onClick={onClose} style={{
                fontSize: 14, color: '#d90000', background: 'none',
                border: 'none', textDecoration: 'underline', cursor: 'pointer'
              }}>
                Baigti sesiją
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
