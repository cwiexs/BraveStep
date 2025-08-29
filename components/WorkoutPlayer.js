import { useEffect, useState, useRef, useMemo } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw, Settings } from "lucide-react";
import { useTranslation } from "next-i18next";

export default function WorkoutPlayer({ workoutData, planId, onClose }) {
  const { t, i18n } = useTranslation("common");

  // ---- State ----
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro"); // intro | exercise | summary
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [playedWarnings, setPlayedWarnings] = useState([]);
  const [paused, setPaused] = useState(false);
  const [stepFinished, setStepFinished] = useState(false);

  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // ---- Refs ----
  const wakeLockRef = useRef(null);
  const timerRef = useRef(null);

  // ---- Derived ----
  const day = workoutData?.days?.[currentDay];
  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  const isLastExerciseInDay =
    !!day && currentExerciseIndex === (day?.exercises?.length || 1) - 1;
  const isLastStepInExercise =
    !!exercise && currentStepIndex === (exercise?.steps?.length || 1) - 1;
  const isTerminalRestAfter =
    step?.type === "rest_after" && isLastExerciseInDay && isLastStepInExercise;

  // ---- i18n labels (naudojam tavo common vertimus, jei jų nėra – fallback) ----
  const restLabel = t("player.rest", { defaultValue: "Poilsis" });
  const upNextLabel = t("player.upNext", { defaultValue: "Kitas:" });
  const setWord = t("player.setWord", { defaultValue: "Serija" });
  const secShort = t("player.secShort", { defaultValue: i18n.language?.startsWith("lt") ? "sek" : "sec" });
  const startWorkoutLabel = t("player.startWorkout", { defaultValue: "Pradėti treniruotę" });
  const doneLabel = t("player.done", { defaultValue: "Atlikta" });
  const prevLabel = t("player.prev", { defaultValue: "Atgal" });
  const nextLabel = t("player.next", { defaultValue: "Toliau" });
  const pausePlayLabel = t("player.pausePlay", { defaultValue: "Pauzė / Tęsti" });
  const restartStepLabel = t("player.restartStep", { defaultValue: "Perkrauti žingsnį" });
  const endSessionLabel = t("player.endSession", { defaultValue: "Baigti sesiją" });
  const pausedLabel = t("player.paused", { defaultValue: "Pauzė" });
  const workoutCompletedLabel = t("player.workoutCompleted", { defaultValue: "Treniruotė užbaigta!" });
  const thanksForWorkingOut = t("player.thanksForWorkingOut", { defaultValue: "Ačiū už treniruotę!" });
  const howWasDifficulty = t("player.howWasDifficulty", { defaultValue: "Kaip vertini sunkumą?" });
  const commentPlaceholder = t("player.commentPlaceholder", { defaultValue: "Komentaras (nebūtina)..." });
  const finishWorkout = t("player.finishWorkout", { defaultValue: "Užbaigti ir išsiųsti įvertinimą" });
  const thanksForFeedback = t("player.thanksForFeedback", { defaultValue: "Ačiū už grįžtamąjį ryšį!" });
  const exerciseLabel = t("player.exercise", { defaultValue: "Pratimas" });
  const motivationTitle = t("player.motivationTitle", { defaultValue: "Motyvacija" });

  // ---- Utils ----
  function parseSeconds(text) {
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  function isTimed(text) {
    if (!text) return false;
    return /(\d+)\s*(sek|sec)\.?/i.test(text);
  }

  function vibe(ms = 60) {
    if (!vibrationEnabled) return;
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  }

  // Sekantis pratimas/serija – rodysime po laikmačiu (be atskiro lango)
  const nextExerciseInfo = useMemo(() => {
    if (!day) return null;
    let exIdx = currentExerciseIndex;
    let stIdx = currentStepIndex + 1;

    while (exIdx < (day.exercises?.length || 0)) {
      const ex = day.exercises?.[exIdx];
      if (!ex) break;
      while (stIdx < (ex.steps?.length || 0)) {
        const st = ex.steps?.[stIdx];
        if (st?.type === "exercise") {
          const totalSets = ex.steps?.filter(s => s.type === "exercise").length || 0;
          const setNo = st?.set ?? null;
          return { ex, st, totalSets, setNo };
        }
        stIdx++;
      }
      exIdx++;
      stIdx = 0;
    }
    return null;
  }, [day, currentExerciseIndex, currentStepIndex]);

  // ---- WakeLock ----
  useEffect(() => {
    if ("wakeLock" in navigator) {
      navigator.wakeLock
        .request("screen")
        .then(lock => (wakeLockRef.current = lock))
        .catch(() => {});
    }
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // ---- Load settings (vibration) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bs_vibration_enabled");
      if (raw != null) setVibrationEnabled(raw === "true");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("bs_vibration_enabled", String(vibrationEnabled));
    } catch {}
  }, [vibrationEnabled]);

  // ---- Timer setup per step ----
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

  // Vibracija perjungus pratimą/poilsį
  useEffect(() => {
    if (phase !== "exercise" || !step) return;
    // vibruojam trumpai kaskart pasikeitus step/poilsis
    vibe(50);
  }, [phase, currentExerciseIndex, currentStepIndex, step]);

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

  // ---- Navigation handlers ----
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
    vibe(70);

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

  // ---- Submit feedback ----
  async function submitFeedback() {
    try {
      await fetch("/api/complete-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, difficultyRating: rating, userComment: comment })
      });
    } catch {}
    setSubmitted(true);
  }

  // ===================== UI =====================
  // BENDRAS KONTEINERIS: VISĄ TRENIRUOTĘ – VISAS EKRANAS BALTAI (be mirgėjimo)
  const Shell = ({ children, footer }) => (
    <div className="fixed inset-0 bg-white text-gray-900 flex flex-col z-50">
      {/* Settings button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 shadow"
          aria-label="Settings"
          title={t("common.settings", { defaultValue: "Nustatymai" })}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">{children}</div>
      {footer ? (
        <div className="border-t p-4 sticky bottom-0 bg-white">{footer}</div>
      ) : null}

      {/* Settings modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-xl font-bold mb-4">{t("common.settings", { defaultValue: "Nustatymai" })}</h3>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t("player.vibration", { defaultValue: "Vibracija" })}</p>
                <p className="text-sm text-gray-500">
                  {t("player.vibrationDesc", { defaultValue: "Vibruoti kaitaliojant pratimą / poilsį." })}
                </p>
              </div>
              <button
                onClick={() => setVibrationEnabled(v => !v)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${vibrationEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                {vibrationEnabled ? t("common.on", { defaultValue: "Įjungta" }) : t("common.off", { defaultValue: "Išjungta" })}
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { vibe(80); }}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                {t("player.testVibration", { defaultValue: "Išbandyti" })}
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                {t("common.close", { defaultValue: "Uždaryti" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- Intro (motyvacija) – CENTRUOTA ----
  if (phase === "intro") {
    return (
      <Shell
        footer={
          <div className="flex flex-col items-center gap-3">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
              onClick={handleManualContinue}
            >
              {startWorkoutLabel}
            </button>
          </div>
        }
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold mb-4">💡 {motivationTitle}</h2>
            <p className="text-base whitespace-pre-wrap leading-relaxed">
              {workoutData?.days?.[0]?.motivationStart || ""}
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- Exercise / Rest ----
  if (phase === "exercise") {
    const isRestPhase = (step?.type === "rest" || (step?.type === "rest_after" && !isTerminalRestAfter));
    const seriesTotal = exercise?.steps?.filter(s => s.type === "exercise").length || 0;
    const seriesIdx = step?.type === "exercise" ? step?.set : null;

    // Spalvos: pratimo laikmatis – žalias; poilsio – geltonas
    const timerColorClass = isRestPhase ? "text-yellow-500" : "text-green-600";
    const restLabelClass = "text-yellow-500"; // "Poilsis" geltonas

    return (
      <Shell
        footer={
          <>
            {/* Valdiklių eilutė */}
            <div className="flex items-center justify-center gap-4">
              <button onClick={goToPrevious} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={prevLabel}>
                <SkipBack className="w-6 h-6 text-gray-800" />
              </button>
              <button onClick={() => setPaused(prev => !prev)} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={pausePlayLabel}>
                {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
              </button>
              <button onClick={restartCurrentStep} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={restartStepLabel}>
                <RotateCcw className="w-6 h-6 text-gray-800" />
              </button>
              <button onClick={goToNext} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={nextLabel}>
                <SkipForward className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            {/* Baigti sesiją – atskirai žemiau */}
            <div className="mt-3 flex justify-center">
              <button onClick={onClose} className="text-sm text-red-600 hover:underline">
                {endSessionLabel}
              </button>
            </div>
          </>
        }
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Viršus: pavadinimas (rest – geltonas užrašas) */}
          <h2 className={`text-2xl font-extrabold mb-2 ${isRestPhase ? restLabelClass : "text-gray-900"}`}>
            {isRestPhase ? restLabel : (exercise?.name || exerciseLabel)}
          </h2>

          {/* SERIJA – iškart po pavadinimo */}
          {!isRestPhase && step?.type === "exercise" && (
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {setWord} {seriesIdx}/{seriesTotal}
            </p>
          )}

          {/* APRAŠYMAS – po serijos */}
          {!isRestPhase && (
            <p className="text-sm text-gray-700 italic mb-4">{exercise?.description}</p>
          )}

          {/* LAIKMATIS – didelis, CENTRUOTAS */}
          {isTimed(step?.duration) && (
            <p className={`text-6xl font-extrabold ${timerColorClass} mt-6`}>
              {secondsLeft > 0 ? `${secondsLeft} ${secShort}` : null}
            </p>
          )}
          {paused && <p className="text-red-600 font-semibold mt-2">{pausedLabel}</p>}

          {/* NETIMUOJAMI žingsniai – „Atlikta“ mygtukas */}
          {waitingForUser && step?.type === "exercise" && (
            <div className="mt-6">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                onClick={handleManualContinue}
              >
                {doneLabel}
              </button>
            </div>
          )}

          {/* POILSIO REŽIMAS – „Kitas:“ info PO LAIKMAČIO, be jokio dėžutės/box'o */}
          {isRestPhase && (
            <div className="mt-6 text-left inline-block text-start">
              <p className="text-sm font-semibold text-gray-700 mb-1">{upNextLabel}</p>
              {nextExerciseInfo ? (
                <>
                  <p className="text-base font-bold text-gray-900">{nextExerciseInfo.ex?.name}</p>
                  {nextExerciseInfo.setNo != null && (
                    <p className="text-sm text-gray-800 mt-1">
                      {setWord} {nextExerciseInfo.setNo}/{nextExerciseInfo.totalSets}
                    </p>
                  )}
                  {nextExerciseInfo.ex?.description && (
                    <p className="text-sm text-gray-700 italic mt-2">
                      {nextExerciseInfo.ex.description}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600 italic">
                  {t("player.almostFinished", { defaultValue: i18n.language?.startsWith("lt") ? "Netoli pabaigos..." : "Almost finished..." })}
                </p>
              )}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  // ---- Summary ----
  if (phase === "summary") {
    const options = [
      { value: 1, label: "😣", text: t("player.rateTooHard", { defaultValue: "Per sunku" }) },
      { value: 2, label: "😟", text: t("player.rateAHard", { defaultValue: "Šiek tiek sunku" }) },
      { value: 3, label: "😌", text: t("player.ratePerfect", { defaultValue: "Tobulai" }) },
      { value: 4, label: "🙂", text: t("player.rateAEasy", { defaultValue: "Šiek tiek lengva" }) },
      { value: 5, label: "😄", text: t("player.rateTooEasy", { defaultValue: "Per lengva" }) }
    ];

    return (
      <Shell
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
              onClick={submitFeedback}
              disabled={submitted}
            >
              {finishWorkout}
            </button>
            <button
              className="text-sm text-gray-600 underline"
              onClick={onClose}
            >
              {t("common.close", { defaultValue: "Uždaryti" })}
            </button>
            {submitted && <span className="text-green-600">{thanksForFeedback}</span>}
          </div>
        }
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">🎉 {workoutCompletedLabel}</h2>
          <p className="mb-4 text-gray-800 whitespace-pre-wrap text-center">
            {workoutData?.days?.[0]?.motivationEnd || thanksForWorkingOut}
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

          <p className="text-sm text-gray-700 mb-2 font-semibold">{howWasDifficulty}</p>

          <div className="flex justify-start gap-2 mb-2">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRating(opt.value)}
                className={`text-3xl p-1 rounded-full border-2 
                  ${rating === opt.value ? "border-green-600 bg-green-50" : "border-transparent"}
                  hover:border-green-400`}
                type="button"
                title={opt.text}
                aria-label={opt.text}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {options.map(opt => (
              <span key={opt.value} className={`text-xs ${rating === opt.value ? "font-bold text-green-700" : "text-gray-400"}`}>
                {opt.text}
              </span>
            ))}
          </div>

          <textarea
            placeholder={commentPlaceholder}
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full p-3 border rounded mb-24"
            rows={4}
          />
        </div>
      </Shell>
    );
  }

  return null;
}
