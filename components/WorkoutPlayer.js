import { useEffect, useState, useRef, useMemo } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw, Settings, Power } from "lucide-react";
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
  const [paused, setPaused] = useState(false);
  const [stepFinished, setStepFinished] = useState(false);

  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Settings (persisted)
  const [showSettings, setShowSettings] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [fxEnabled, setFxEnabled] = useState(true);       // perjungimo 
  const [autoplayNext, setAutoplayNext] = useState(true); // kito zingsnio auto-start
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ---- Refs ----
  const rafRef = useRef(null);
  const initialTimeRef = useRef(null);
  const remainingRef = useRef(0);
  const beepAudioRef = useRef(null);
  const tickAudioRef = useRef(null);
  const doneAudioRef = useRef(null);
  const lastSecondRef = useRef(null);

  const timeoutsRef = useRef([]);
  const intervalsRef = useRef([]);

  // UI lock (disable double-clicks)
  const [uiLocked, setUiLocked] = useState(false);
  const [inputActive, setInputActive] = useState(false);

  // ---- Derived ----
  const day = workoutData?.days?.[currentDay];
  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  const isTerminalRestAfter = useMemo(() => {
    if (!exercise?.steps) return false;
    const last = exercise.steps[exercise.steps.length - 1];
    return last?.type === "rest_after";
  }, [exercise?.steps]);

  // ---- i18n labels ----
  const introTitle = t("player.introTitle", { defaultValue: i18n.language?.startsWith("lt") ? "Apžvalga" : "Overview" });
  const startWorkout = t("player.startWorkout", { defaultValue: i18n.language?.startsWith("lt") ? "Pradėti treniruotę" : "Start workout" });
  const nextLabel = t("player.next", { defaultValue: i18n.language?.startsWith("lt") ? "Kitas" : "Next" });
  const prevLabel = t("player.prev", { defaultValue: i18n.language?.startsWith("lt") ? "Ankstesnis" : "Prev" });
  const pausePlayLabel = paused
    ? t("player.play", { defaultValue: i18n.language?.startsWith("lt") ? "Leisti" : "Play" })
    : t("player.pause", { defaultValue: i18n.language?.startsWith("lt") ? "Pauzė" : "Pause" });
  const restartStepLabel = t("player.restart", { defaultValue: i18n.language?.startsWith("lt") ? "Iš naujo" : "Restart" });

  const settingsLabel = t("player.settings", { defaultValue: i18n.language?.startsWith("lt") ? "Nustatymai" : "Settings" });
  const endSessionLabel = t("player.endSession", { defaultValue: i18n.language?.startsWith("lt") ? "Baigti" : "End" });
  const exerciseLabel = t("player.exercise", { defaultValue: i18n.language?.startsWith("lt") ? "Pratimas" : "Exercise" });
  const restLabel = t("player.rest", { defaultValue: i18n.language?.startsWith("lt") ? "Poilsis" : "Rest" });
  const getReadyLabel = t("player.getReady", { defaultValue: i18n.language?.startsWith("lt") ? "Pasiruošk" : "Get ready" });
  const setWord = t("player.set", { defaultValue: i18n.language?.startsWith("lt") ? "Serija" : "Set" });

  const workoutCompletedLabel = t("player.workoutCompleted", { defaultValue: i18n.language?.startsWith("lt") ? "Treniruotė baigta!" : "Workout completed!" });
  const thanksForWorkingOut = t("player.thanksForWorkingOut", { defaultValue: i18n.language?.startsWith("lt") ? "Ačiū, kad sportavai šiandien!" : "Thanks for working out today!" });
  const commentPlaceholder = t("player.commentPlaceholder", { defaultValue: i18n.language?.startsWith("lt") ? "Trumpas atsiliepimas (pasirinktinai)" : "Add a short comment (optional)" });
  const howWasDifficulty = t("player.howWasDifficulty", { defaultValue: i18n.language?.startsWith("lt") ? "Kaip vertini sunkumą?" : "How was the difficulty?" });
  const submitLabel = t("player.submit", { defaultValue: i18n.language?.startsWith("lt") ? "Išsaugoti" : "Save" });

  // ---- Effects: load sounds ----
  useEffect(() => {
    const tick = new Audio("/sounds/tick.mp3");
    const beep = new Audio("/sounds/beep.mp3");
    const done = new Audio("/sounds/done.mp3");
    tick.preload = "auto";
    beep.preload = "auto";
    done.preload = "auto";
    tickAudioRef.current = tick;
    beepAudioRef.current = beep;
    doneAudioRef.current = done;

    return () => {
      tick.pause?.();
      beep.pause?.();
      done.pause?.();
    };
  }, []);

  // ---- Timer helpers ----
  function scheduleTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }
  function scheduleInterval(fn, ms) {
    const id = setInterval(fn, ms);
    intervalsRef.current.push(id);
    return id;
  }
  function stopAllScheduled() {
    timeoutsRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timeoutsRef.current = [];
    intervalsRef.current = [];
  }

  function cancelRaf() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function playBeep() {
    if (!soundEnabled || !fxEnabled) return;
    try { beepAudioRef.current?.currentTime = 0; beepAudioRef.current?.play(); } catch {}
  }
  function playTick() {
    if (!soundEnabled || !fxEnabled) return;
    try { tickAudioRef.current?.currentTime = 0; tickAudioRef.current?.play(); } catch {}
  }
  function playDone() {
    if (!soundEnabled || !fxEnabled) return;
    try { doneAudioRef.current?.currentTime = 0; doneAudioRef.current?.play(); } catch {}
  }

  function vibrate(ms = 60) {
    if (!vibrationEnabled) return;
    try { navigator?.vibrate?.(ms); } catch {}
  }

  // ---- Phase flow ----
  useEffect(() => {
    // start at intro
    setPhase("intro");
    setCurrentExerciseIndex(0);
    setCurrentStepIndex(0);
    setWaitingForUser(false);
    setPaused(false);
    setStepFinished(false);
  }, [workoutData, currentDay]);

  function startStepCountdown(totalSeconds) {
    remainingRef.current = totalSeconds;
    lastSecondRef.current = Math.ceil(totalSeconds);
    initialTimeRef.current = performance.now();

    const loop = (now) => {
      const elapsed = (now - initialTimeRef.current) / 1000;
      const remain = Math.max(0, totalSeconds - elapsed);
      setSecondsLeft(remain);

      const thisSecond = Math.ceil(remain);
      if (thisSecond !== lastSecondRef.current) {
        lastSecondRef.current = thisSecond;
        if (thisSecond <= 3 && thisSecond > 0) playBeep();
        if (thisSecond > 0 && thisSecond % 1 === 0) playTick();
        if (thisSecond === 0) playDone();
      }

      if (remain > 0 && !paused) {
        rafRef.current = requestAnimationFrame(loop);
      } else if (remain <= 0) {
        setStepFinished(true);
        vibrate(80);
        if (autoplayNext) scheduleTimeout(next, 500);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }

  function pauseTimer() {
    setPaused(true);
    cancelRaf();
  }
  function resumeTimer() {
    setPaused(false);
    initialTimeRef.current = performance.now() - (remainingRef.current - secondsLeft) * 1000;
    rafRef.current = requestAnimationFrame((now) => startStepCountdown(remainingRef.current));
  }

  // ---- Navigation ----
  function goToPrevious() {
    cancelRaf();
    stopAllScheduled();
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
    cancelRaf();
    stopAllScheduled();
    if (step && exercise && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (day && currentExerciseIndex + 1 < (day.exercises?.length || 0)) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    } else {
      setPhase("summary");
    }
  }
  function restartCurrentStep() {
    cancelRaf();
    stopAllScheduled();
    setStepFinished(false);
    if (step?.duration) startStepCountdown(step.duration);
  }

  function next() {
    if (uiLocked) return;
    setUiLocked(true);
    scheduleTimeout(() => setUiLocked(false), 250);

    if (waitingForUser) {
      setWaitingForUser(false);
      if (step?.duration) startStepCountdown(step.duration);
      return;
    }

    if (step && exercise && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      const s = exercise.steps[currentStepIndex + 1];
      setStepFinished(false);
      if (s?.duration) startStepCountdown(s.duration);
      return;
    }

    if (day && currentExerciseIndex + 1 < (day.exercises?.length || 0)) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      const s0 = day.exercises[currentExerciseIndex + 1]?.steps?.[0];
      setStepFinished(false);
      if (s0?.duration) startStepCountdown(s0.duration);
      return;
    }

    setPhase("summary");
  }

  // ---- Render helpers ----
  function Shell({ footer, children }) {
    return (
      <div className="min-h-[60vh] w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-2">
          <button type="button" onClick={() => setShowSettings(s => !s)} className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <Settings className="w-4 h-4" /> {settingsLabel}
          </button>
          <button type="button" onClick={onClose} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
            <Power className="w-4 h-4" /> {endSessionLabel}
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-3 py-2 border-y bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={vibrationEnabled} onChange={(e) => setVibrationEnabled(e.target.checked)} />
              <span>Vibration</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={fxEnabled} onChange={(e) => setFxEnabled(e.target.checked)} />
              <span>FX (sounds & highlight)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoplayNext} onChange={(e) => setAutoplayNext(e.target.checked)} />
              <span>Autoplay next step</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
              <span>Sound</span>
            </label>
          </div>
        )}

        {/* Body */}
        <div className="px-3 py-3">{children}</div>

        {/* Footer */}
        <div className="px-3 py-3 border-t bg-white sticky bottom-0">
          {footer}
        </div>
      </div>
    );
  }

  // ---- Intro ----
  if (phase === "intro") {
    const today = workoutData?.days?.[currentDay];

    return (
      <Shell
        footer={
          <div className="flex items-center justify-center">
            <button type="button" onClick={() => {
              setPhase("exercise");
              const s0 = today?.exercises?.[0]?.steps?.[0];
              setCurrentExerciseIndex(0);
              setCurrentStepIndex(0);
              setStepFinished(false);
              setWaitingForUser(false);
              if (s0?.duration) startStepCountdown(s0.duration);
            }} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
              {startWorkout}
            </button>
          </div>
        }
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-2">{introTitle}</h2>
          <p className="text-gray-800 whitespace-pre-wrap">
            {today?.motivationStart || workoutData?.motivationStart}
          </p>

          {today?.waterRecommendation && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900 mt-3">
              💧 {today.waterRecommendation}
            </div>
          )}

          {today?.outdoorSuggestion && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-900 mt-3">
              🌳 {today.outdoorSuggestion}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  // ---- Exercise / Rest ----
  if (phase === "exercise") {
    const isRestPhase = (step?.type === "rest" || (step?.type === "rest_after" && !isTerminalRestAfter));
    const seriesTotal = exercise?.steps?.filter(s => s.type === "exercise").length || 0;
    const seriesIdx = step?.type === "exercise" ? step?.set : null;

    const timerColorClass = isRestPhase ? "text-yellow-500" : "text-green-600";
    const restLabelClass = "text-yellow-500";

    return (
      <Shell
        footer={
          <>
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={goToPrevious} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={prevLabel}>
                <SkipBack className="w-6 h-6 text-gray-800" />
              </button>
              <button type="button" onClick={() => (paused ? resumeTimer() : pauseTimer())} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={pausePlayLabel}>
                {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
              </button>
              <button type="button" onClick={restartCurrentStep} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={restartStepLabel}>
                <RotateCcw className="w-6 h-6 text-gray-800" />
              </button>
              <button type="button" onClick={goToNext} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={nextLabel}>
                <SkipForward className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={onClose} className="text-sm text-red-600 hover:underline">
                {endSessionLabel}
              </button>
            </div>
          </>
        }
      >
        <div className="max-w-2xl mx-auto text-center mt-6">
          <h2 className={`text-2xl font-extrabold mb-2 ${isRestPhase ? restLabelClass : "text-gray-900"}`}>
            {isRestPhase ? restLabel : (exercise?.name || exerciseLabel)}
          </h2>

          {!isRestPhase && step?.type === "exercise" && (
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {setWord} {seriesIdx}/{seriesTotal}
            </p>
          )}

          <div className="text-6xl font-mono mb-6">
            <span className={timerColorClass}>{Math.ceil(secondsLeft)}</span>
          </div>

          {/* Controls inline */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button type="button" onClick={goToPrevious} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={prevLabel}>
              <SkipBack className="w-6 h-6 text-gray-800" />
            </button>
            <button type="button" onClick={() => (paused ? resumeTimer() : pauseTimer())} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={pausePlayLabel}>
              {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
            </button>
            <button type="button" onClick={restartCurrentStep} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={restartStepLabel}>
              <RotateCcw className="w-6 h-6 text-gray-800" />
            </button>
            <button type="button" onClick={goToNext} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={nextLabel}>
              <SkipForward className="w-6 h-6 text-gray-800" />
            </button>
          </div>

          {/* Secondary info */}
          <div className="text-sm text-gray-700">
            {step?.type === "exercise" && step?.duration && (
              <p>
                {t("player.doExerciseFor", { defaultValue: i18n.language?.startsWith("lt") ? "Daryk pratimą" : "Do exercise for" })} {Math.round(step.duration)}s
              </p>
            )}
            {isRestPhase && step?.duration && (
              <p>
                {t("player.restFor", { defaultValue: i18n.language?.startsWith("lt") ? "Ilsėkis" : "Rest for" })} {Math.round(step.duration)}s
              </p>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "summary") {
    const options = [
      { value: 1, label: "😣", text: t("player.rateTooHard", { defaultValue: "Per sunku" }) },
      { value: 2, label: "😟", text: t("player.rateAHard", { defaultValue: "Šiek tiek sunku" }) },
      { value: 3, label: "😌", text: t("player.ratePerfect", { defaultValue: "Tobulai" }) },
      { value: 4, label: "🙂", text: t("player.rateAEasy", { defaultValue: "Šiek tiek lengva" }) },
      { value: 5, label: "😄", text: t("player.rateTooEasy", { defaultValue: "Per lengva" }) }
    ];

    return (
      <div onSubmitCapture={(e) => e.preventDefault()}>
      <Shell
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
              onClick={async () => {
                try {
                  // TODO: persist rating/comment here
                  setSubmitted(true);
                  vibrate(40);
                } catch (e) {}
              }}
            >
              {submitLabel}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-red-600 hover:underline">
              {endSessionLabel}
            </button>
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
              🌳 {workoutData.days[0].outdoorSuggestion}
            </div>
          )}

          <p className="text-sm text-gray-700 mb-2 font-semibold">{howWasDifficulty}</p>

          <div className="flex justify-start gap-2 mb-2">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRating(opt.value); }}
                onMouseDown={(e) => e.preventDefault()}
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

          <div className="grid grid-cols-5 gap-1 mb-2 text-gray-500">
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
            onFocus={() => setInputActive(true)}
            onBlur={() => setInputActive(false)}
            onKeyDown={(e) => { e.stopPropagation(); /* if any parent tries to submit on Enter, uncomment next line */ /* if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); } */ }}
            className="w-full p-3 border rounded mb-24 outline-none focus:ring-2 focus:ring-black/10"
            rows={4}
          />
        </div>
      </Shell>
      </div>
    );
  }

  return null;
}
