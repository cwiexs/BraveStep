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
  const [fxEnabled, setFxEnabled] = useState(true);       // perjungimo garsas
  // paliekame select'ą, bet realiai naudojame tik beep (silence – tik iOS unlock)
  const [fxTrack, setFxTrack] = useState("beep");         // "beep" | "silence"
  const [voiceEnabled, setVoiceEnabled] = useState(true); // balso skaičiavimas
  const [vibrationSupported, setVibrationSupported] = useState(false);

  // Voice countdown helpers
  const [lastVoiceSecond, setLastVoiceSecond] = useState(null); // 5..1

  // Apsauga: kai aktyvus įvesties laukas – neleidžiam „Power“
  const [inputActive, setInputActive] = useState(false);

  // ---- Refs ----
  const wakeLockRef = useRef(null);

  // Laikmačio ref’ai (tikslus deadline metodas)
  const tickRef = useRef(null);           // setTimeout id
  const deadlineRef = useRef(null);       // epoch ms, kada step turi baigtis
  const remainMsRef = useRef(null);       // ms, likę pauzės akimirką

  const timeoutsRef = useRef([]);
  const audioRef = useRef({
    loaded: false,
    beep: null,
    silence: null, // iOS unlock
    nums: {}       // {1: Audio, ... 5: Audio}
  });

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

  // ---- i18n labels ----
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
    // pastaba: jei turi `step.duration` kaip skaičių – žemiau tai irgi palaikoma
  }
  function isTimed(text) {
    if (typeof text === "number") return text > 0;
    if (!text) return false;
    return /(\d+)\s*(sek|sec)\.?/i.test(text);
  }

  function clearAllTimeouts() {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  }

  // Audio init + iOS unlock (BE "Get ready")
  function ensureAudioLoaded() {
    if (audioRef.current.loaded) return;
    audioRef.current.beep = new Audio("/beep.wav");
    audioRef.current.silence = new Audio("/silance.mp3"); // palaikom tavo failo pavadinimą
    audioRef.current.nums = {
      1: new Audio("/1.mp3"),
      2: new Audio("/2.mp3"),
      3: new Audio("/3.mp3"),
      4: new Audio("/4.mp3"),
      5: new Audio("/5.mp3"),
    };
    try {
      audioRef.current.beep.load();
      Object.values(audioRef.current.nums).forEach(a => { try { a.load(); } catch {} });
    } catch {}
    audioRef.current.loaded = true;
  }

  // Paleidžiam „silence“ vos paspaudus Start – iOS audio unlock
  function primeIOSAudio() {
    ensureAudioLoaded();
    try {
      const s = audioRef.current.silence;
      s.volume = 0.02;           // labai tyliai
      s.currentTime = 0;
      s.play()
        .then(() => {
          setTimeout(() => {
            try { s.pause(); s.currentTime = 0; } catch {}
          }, 200);
        })
        .catch(() => {});
    } catch {}
  }

  function playFx() {
    if (!fxEnabled) return;
    ensureAudioLoaded();
    try {
      const track = audioRef.current.beep;
      track.currentTime = 0;
      track.volume = 0.6;
      track.play().catch(() => {});
    } catch {}
  }

  function playVoiceNumber(n) {
    if (!voiceEnabled) return;
    ensureAudioLoaded();
    const a = audioRef.current.nums?.[n];
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch {}
  }

  function vibe(pattern = [40, 40]) {
    if (!vibrationEnabled) return;
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  // Sekantis pratimas/serija – rodysime po laikmačiu (be box'o)
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
      navigator.wakeLock.request("screen").then(lock => (wakeLockRef.current = lock)).catch(() => {});
    }
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, []);

  // ---- Support detection + settings persist ----
  useEffect(() => {
    try {
      setVibrationSupported(typeof navigator !== "undefined" && "vibrate" in navigator);
      const v = localStorage.getItem("bs_vibration_enabled");    if (v != null) setVibrationEnabled(v === "true");
      const f = localStorage.getItem("bs_fx_enabled");           if (f != null) setFxEnabled(f === "true");
      const ft = localStorage.getItem("bs_fx_track");            if (ft) setFxTrack(ft);
      const vo = localStorage.getItem("bs_voice_enabled");       if (vo != null) setVoiceEnabled(vo === "true");
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("bs_vibration_enabled", String(vibrationEnabled)); } catch {} }, [vibrationEnabled]);
  useEffect(() => { try { localStorage.setItem("bs_fx_enabled", String(fxEnabled)); } catch {} }, [fxEnabled]);
  useEffect(() => { try { localStorage.setItem("bs_fx_track", fxTrack); } catch {} }, [fxTrack]);
  useEffect(() => { try { localStorage.setItem("bs_voice_enabled", String(voiceEnabled)); } catch {} }, [voiceEnabled]);

  // ---- Timer helpers (tikslus deadline) ----
  const clearTick = () => {
    if (tickRef.current) {
      clearTimeout(tickRef.current);
      tickRef.current = null;
    }
  };

  const startTimedStep = (durationSec) => {
    clearTick();
    if (!durationSec || durationSec <= 0) {
      // jei žingsnis be laiko – iškart sekantis
      setSecondsLeft(0);
      setWaitingForUser(true);
      return;
    }
    setWaitingForUser(false);
    setPaused(false);
    const now = Date.now();
    deadlineRef.current = now + durationSec * 1000 + 30; // mažytė „pagalvė“
    setSecondsLeft(durationSec);
    tickRef.current = setTimeout(tick, 180);
    // perjungimo momentu – vibracija + beep
    vibe([40, 40]);
    playFx();
    // atstatom skaičiavimo būseną
    setLastVoiceSecond(null);
  };

  const tick = () => {
    if (!deadlineRef.current) return;
    const now = Date.now();
    const msLeft = Math.max(0, deadlineRef.current - now);
    const secs = Math.ceil(msLeft / 1000);
    setSecondsLeft(prev => (prev !== secs ? secs : prev));

    // 5..1 skaičiavimas (tik kai aktyvu)
    if (!paused && voiceEnabled && secs > 0 && secs <= 5) {
      if (lastVoiceSecond !== secs) {
        playVoiceNumber(secs);
        setLastVoiceSecond(secs);
      }
    }

    if (msLeft <= 0) {
      clearTick();
      setStepFinished(true);
      handlePhaseComplete();
      return;
    }
    tickRef.current = setTimeout(tick, 180);
  };

  const pauseTimer = () => {
    if (paused) return;
    setPaused(true);
    if (deadlineRef.current) remainMsRef.current = Math.max(0, deadlineRef.current - Date.now());
    clearTick();
  };

  const resumeTimer = () => {
    if (!paused) return;
    setPaused(false);
    if (remainMsRef.current != null) {
      deadlineRef.current = Date.now() + remainMsRef.current;
      setLastVoiceSecond(null);
      tickRef.current = setTimeout(tick, 180);
    }
  };

  // ---- Timer setup per step ----
  useEffect(() => {
    clearTick();
    deadlineRef.current = null;

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

    // palaikome tiek tekstinį "30 sek", tiek skaitinį duration
    const duration = typeof step?.duration === "number" ? step.duration : (isTimed(step?.duration) ? parseSeconds(step?.duration) : 0);

    if (duration > 0) {
      startTimedStep(duration);
    } else {
      // untimed – laukiame vartotojo
      setSecondsLeft(0);
      setWaitingForUser(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseIndex, currentStepIndex, phase, step, isTerminalRestAfter]);

  // Auto-pause kai atidaromi nustatymai
  useEffect(() => {
    if (showSettings) pauseTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings]);

  useEffect(() => {
    setStepFinished(false);
  }, [currentStepIndex, currentExerciseIndex]);

  useEffect(() => {
    return () => { clearAllTimeouts(); clearTick(); };
  }, []);

  // ---- Navigation handlers ----
  function handleManualContinue() {
    clearTick();
    if (phase === "intro") {
      // iOS audio unlock
      primeIOSAudio();
      setPhase("exercise");
      // pirmo step’o inicijavimas – atliks useEffect (aukščiau)
    } else if (phase === "exercise") {
      setStepFinished(true);
      handlePhaseComplete();
    } else if (phase === "summary") {
      onClose?.();
    }
  }

  function handlePhaseComplete() {
    clearTick();

    if (exercise && step && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      return;
    }
    if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
      return;
    }
    setPhase("summary");
  }

  function goToPrevious() {
    clearTick();
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
    clearTick();
    if (step && exercise && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentStepIndex(0);
    }
  }
  function restartCurrentStep() {
    clearTick();
    const duration = typeof step?.duration === "number" ? step.duration : (isTimed(step?.duration) ? parseSeconds(step?.duration) : 0);
    if (duration > 0) startTimedStep(duration);
  }

  // ===================== UI =====================
  const HeaderBar = () => (
    <div className="h-12 px-3 flex items-center justify-end gap-2 border-b bg-white sticky top-0 z-50">
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 shadow"
        aria-label={t("common.settings", { defaultValue: "Nustatymai" })}
        title={t("common.settings", { defaultValue: "Nustatymai" })}
      >
        <Settings className="w-5 h-5" />
      </button>
      <button
        onClick={() => { if (!inputActive) onClose?.(); }}
        className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 shadow ${inputActive ? "pointer-events-none opacity-50" : ""}`}
        aria-label={t("common.close", { defaultValue: "Uždaryti" })}
        title={t("common.close", { defaultValue: "Uždaryti" })}
      >
        <Power className="w-5 h-5" />
      </button>
    </div>
  );

  const Shell = ({ children, footer }) => (
    <div className="fixed inset-0 bg-white text-gray-900 flex flex-col z-40">
      <HeaderBar />
      <div className="flex-1 overflow-auto p-6 pt-8">{children}</div>
      {footer ? <div className="border-t p-4 sticky bottom-0 bg-white">{footer}</div> : null}

      {/* Settings modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-xl font-bold mb-4">{t("common.settings", { defaultValue: "Nustatymai" })}</h3>

            {/* Vibracija */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t("player.vibration", { defaultValue: "Vibracija" })}</p>
                <p className="text-sm text-gray-500">{t("player.vibrationDesc", { defaultValue: "Vibruoti kaitaliojant pratimą / poilsį." })}</p>
              </div>
              <button
                onClick={() => setVibrationEnabled(v => !v)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${vibrationEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                {vibrationEnabled ? t("common.on", { defaultValue: "Įjungta" }) : t("common.off", { defaultValue: "Išjungta" })}
              </button>
            </div>
            {!vibrationSupported && (
              <div className="text-xs text-amber-600 mb-4">
                {t("player.vibrationNotSupported", { defaultValue: "Šiame įrenginyje naršyklė vibracijos nepalaiko." })}
              </div>
            )}

            {/* Perjungimo garsas */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("player.fx", { defaultValue: "Perjungimo garsas" })}</p>
                  <p className="text-sm text-gray-500">{t("player.fxDesc", { defaultValue: "Skambėti keičiantis pratimą / poilsį." })}</p>
                </div>
                <button
                  onClick={() => setFxEnabled(v => !v)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${fxEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
                >
                  {fxEnabled ? t("common.on", { defaultValue: "Įjungta" }) : t("common.off", { defaultValue: "Išjungta" })}
                </button>
              </div>
              <div className="mt-2">
                <label className="text-sm mr-2">{t("player.fxTrack", { defaultValue: "Takelis:" })}</label>
                <select
                  value={fxTrack}
                  onChange={e => setFxTrack(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="beep">beep.wav</option>
                  <option value="silence">silance.mp3</option>
                </select>
                <button
                  onClick={() => { ensureAudioLoaded(); playFx(); }}
                  className="ml-3 px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                >
                  {t("player.testFx", { defaultValue: "Išbandyti" })}
                </button>
              </div>
            </div>

            {/* Balso skaičiavimas (tik 5..1, be „Get ready“) */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t("player.voice", { defaultValue: "Balso skaičiavimas" })}</p>
                <p className="text-sm text-gray-500">
                  {t("player.voiceDescShort", { defaultValue: "Skaičiuoti 5,4,3,2,1 paskutinėmis sekundėmis." })}
                </p>
              </div>
              <button
                onClick={() => setVoiceEnabled(v => !v)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${voiceEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                {voiceEnabled ? t("common.on", { defaultValue: "Įjungta" }) : t("common.off", { defaultValue: "Išjungta" })}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { ensureAudioLoaded(); primeIOSAudio(); }}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                {t("player.primeAudio", { defaultValue: "Paruošti garsą" })}
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

  // ---- Intro (Motyvacija) – kaip buvo (centruota) ----
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
        <div className="w-full min-h-[60vh] grid place-items-center">
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

    const timerColorClass = isRestPhase ? "text-yellow-500" : "text-green-600";
    const restLabelClass = "text-yellow-500";

    return (
      <Shell
        footer={
          <>
            <div className="flex items-center justify-center gap-4">
              <button onClick={goToPrevious} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={prevLabel}>
                <SkipBack className="w-6 h-6 text-gray-800" />
              </button>
              <button onClick={() => (paused ? resumeTimer() : pauseTimer())} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={pausePlayLabel}>
                {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
              </button>
              <button onClick={restartCurrentStep} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={restartStepLabel}>
                <RotateCcw className="w-6 h-6 text-gray-800" />
              </button>
              <button onClick={goToNext} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={nextLabel}>
                <SkipForward className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <button onClick={onClose} className="text-sm text-red-600 hover:underline">
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

          {!isRestPhase && (
            <p className="text-sm text-gray-700 italic mb-4">{exercise?.description}</p>
          )}

          { (typeof step?.duration === "number" ? step.duration > 0 : isTimed(step?.duration)) && (
            <p className={`text-6xl font-extrabold ${timerColorClass} mt-6`}>
              {secondsLeft > 0 ? `${secondsLeft} ${secShort}` : `0 ${secShort}`}
            </p>
          )}
          {paused && <p className="text-red-600 font-semibold mt-2">{pausedLabel}</p>}

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
              onClick={async () => {
                try {
                  await fetch("/api/complete-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ planId, difficultyRating: rating, userComment: comment })
                  });
                } catch {}
                setSubmitted(true);
              }}
              disabled={submitted}
            >
              {finishWorkout}
            </button>
            <button
              className="text-sm text-gray-600 underline"
              onClick={() => { if (!inputActive) onClose?.(); }}
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
            onFocus={() => setInputActive(true)}
            onBlur={() => setInputActive(false)}
            onKeyDown={(e) => e.stopPropagation()} // ← apsauga: neperduoti „karštųjų“ klavišų
            className="w-full p-3 border rounded mb-24 outline-none focus:ring-2 focus:ring-black/10"
            rows={4}
          />
        </div>
      </Shell>
    );
  }

  return null;
}
