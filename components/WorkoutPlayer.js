import { useEffect, useState, useRef, useMemo } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw } from "lucide-react";
import { useTranslation } from "next-i18next";

export default function WorkoutPlayer({ workoutData, planId, onClose }) {
  const { t, i18n } = useTranslation("common");

  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);
  const [paused, setPaused] = useState(false);

  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [stepFinished, setStepFinished] = useState(false);

  const wakeLockRef = useRef(null);
  const timerRef = useRef(null);

  const day = workoutData?.days?.[currentDay];
  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  const isLastExerciseInDay = !!day && currentExerciseIndex === (day?.exercises?.length || 1) - 1;
  const isLastStepInExercise = !!exercise && currentStepIndex === (exercise?.steps?.length || 1) - 1;
  const isTerminalRestAfter = step?.type === "rest_after" && isLastExerciseInDay && isLastStepInExercise;

  const secSuffix = useMemo(
    () => (i18n.language?.startsWith("lt") ? t("player.secShortLt") : t("player.secShortEn")),
    [i18n.language, t]
  );

  useEffect(() => {
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then(lock => (wakeLockRef.current = lock)).catch(() => {});
    }
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, []);

  function parseSeconds(text) {
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  function isTimed(text) {
    if (!text) return false;
    return /(\d+)\s*(sek|sec)\.?/i.test(text);
  }

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phase !== "exercise" || !step) {
      setSecondsLeft(0);
      setWaitingForUser(false);
      return;
    }
    if (isTerminalRestAfter) {
      setWaitingForUser(false);
      setSecondsLeft(0);
      if (!stepFinished) {
        setStepFinished(true);
        setTimeout(() => handlePhaseComplete(), 0);
      }
      return;
    }
    if (isTimed(step.duration)) {
      setSecondsLeft(parseSeconds(step.duration));
      setWaitingForUser(false);
      setPlayedWarnings([]);
    } else {
      setSecondsLeft(0);
      setWaitingForUser(true);
      setPlayedWarnings([]);
    }
  }, [currentExerciseIndex, currentStepIndex, phase, step, isTerminalRestAfter, stepFinished]);

  useEffect(() => {
    setStepFinished(false);
  }, [currentStepIndex, currentExerciseIndex]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phase !== "exercise" || isTerminalRestAfter) return;

    if (secondsLeft > 0 && !paused) {
      timerRef.current = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else if (secondsLeft === 0 && !waitingForUser && step && !stepFinished) {
      setStepFinished(true);
      handlePhaseComplete();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [secondsLeft, waitingForUser, phase, paused, step, stepFinished, isTerminalRestAfter]);

  function handleManualContinue() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phase === "intro") {
      setPhase("exercise");
      if (step && isTimed(step.duration)) {
        setSecondsLeft(parseSeconds(step.duration));
        setWaitingForUser(false);
      } else setWaitingForUser(true);
    } else if (phase === "exercise") {
      setStepFinished(true);
      handlePhaseComplete();
    } else if (phase === "summary") {
      onClose?.();
    }
  }

  function handlePhaseComplete() {
    if (timerRef.current) clearInterval(timerRef.current);
    try { new Audio("/beep.mp3").play().catch(() => {}); } catch {}

    if (exercise && step && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setPlayedWarnings([]);
      return;
    }
    if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      setPlayedWarnings([]);
      return;
    }
    setPhase("summary");
  }

  function goToPrevious() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (step && currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (exercise && currentExerciseIndex > 0) {
      const prevIdx = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevIdx);
      const prevEx = day?.exercises?.[prevIdx];
      setCurrentStepIndex(prevEx?.steps?.length ? prevEx.steps.length - 1 : 0);
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
    if (step && isTimed(step.duration)) setSecondsLeft(parseSeconds(step.duration));
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function submitFeedback() {
    try {
      await fetch("/api/complete-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, difficultyRating: rating, userComment: comment })
      });
    } catch {}
    setSubmitted(true);
    setTimeout(() => onClose?.(), 1500);
  }

  // ===== UI =====
  if (phase === "intro") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-4">💡 {t("player.motivationTitle")}</h2>
          <p className="mb-4 text-gray-800 whitespace-pre-wrap">
            {workoutData?.days?.[0]?.motivationStart || ""}
          </p>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold"
            onClick={handleManualContinue}
          >
            {t("player.startWorkout")}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "exercise") {
    const seriesTotal = exercise?.steps?.filter(s => s.type === "exercise").length || 0;
    const seriesIdx = step?.type === "exercise" ? step?.set : null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {exercise?.name || t("player.exercise")}
          </h2>

          {step?.type === "exercise" && (
            <p className="text-lg font-medium text-gray-900 mb-2">
              {step.duration} — {t("player.setWord")} {seriesIdx}/{seriesTotal}
            </p>
          )}

          {(step?.type === "rest" || (step?.type === "rest_after" && !isTerminalRestAfter)) && (
            <p className="text-lg font-medium text-blue-900 mb-2">
              {t("player.rest")}: {step.duration}
            </p>
          )}

          {isTimed(step?.duration) && (
            <p className="text-4xl text-gray-900 font-bold mb-4">
              {secondsLeft > 0 ? `${secondsLeft} ${secSuffix}` : null}
              {paused && <span className="block text-xl text-red-600 mt-2">{t("player.paused")}</span>}
            </p>
          )}

          <p className="text-sm text-gray-500 italic mb-6">{exercise?.description}</p>

          {waitingForUser && step?.type === "exercise" && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                onClick={handleManualContinue}
              >
                {t("player.done")}
              </button>
            </div>
          )}

          <div className="flex justify-center items-center gap-4 mt-6">
            <button onClick={goToPrevious} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={t("player.prev")}>
              <SkipBack className="w-6 h-6 text-gray-800" />
            </button>
            <button onClick={() => setPaused(prev => !prev)} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={t("player.pausePlay")}>
              {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
            </button>
            <button onClick={restartCurrentStep} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={t("player.restartStep")}>
              <RotateCcw className="w-6 h-6 text-gray-800" />
            </button>
            <button onClick={goToNext} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={t("player.next")}>
              <SkipForward className="w-6 h-6 text-gray-800" />
            </button>
          </div>

          <div className="mt-4">
            <button onClick={onClose} className="text-sm text-red-500 hover:underline">
              {t("player.endSession")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "summary") {
    const options = [
      { value: 1, label: "😣", text: t("player.rateTooHard") },
      { value: 2, label: "😟", text: t("player.rateAHard") },
      { value: 3, label: "😌", text: t("player.ratePerfect") },
      { value: 4, label: "🙂", text: t("player.rateAEasy") },
      { value: 5, label: "😄", text: t("player.rateTooEasy") }
    ];

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-2">🎉 {t("player.workoutCompleted")}</h2>

          <p className="mb-4 text-gray-800 whitespace-pre-wrap">
            {workoutData?.days?.[0]?.motivationEnd || t("player.thanksForWorkingOut")}
          </p>

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

          <p className="text-sm text-gray-600 mb-2 font-semibold">{t("player.howWasDifficulty")}</p>

          <div className="flex justify-center gap-2 mb-2">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRating(opt.value)}
                className={`text-3xl p-1 rounded-full border-2 
                  ${rating === opt.value ? "border-green-500 bg-green-50" : "border-transparent"}
                  hover:border-green-400`}
                type="button"
                title={opt.text}
                aria-label={opt.text}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-2 mb-4">
            {options.map(opt => (
              <span key={opt.value} className={`text-xs ${rating === opt.value ? "font-bold text-green-700" : "text-gray-400"}`}>
                {opt.text}
              </span>
            ))}
          </div>

          <textarea
            placeholder={t("player.commentPlaceholder")}
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            rows={3}
          />

          <button
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            onClick={submitFeedback}
            disabled={submitted}
          >
            {t("player.finishWorkout")}
          </button>

          {submitted && <p className="text-green-600 mt-2">{t("player.thanksForFeedback")}</p>}
        </div>
      </div>
    );
  }

  return null;
}
