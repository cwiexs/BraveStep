import { useEffect, useState, useRef, useMemo } from "react";
import { SkipBack, SkipForward, Pause, Play, RotateCcw, Settings, Power } from "lucide-react";
import { useTranslation } from "next-i18next";

/**
 * WorkoutPlayer
 * - be „Get ready“ garso (paliktas tik 5→1 skaičiavimas balsu / „beep“)
 * - tikslus laikmatis su „endTime“ (mažiau dreifo)
 * - komentarų įvedimas nebeuždaro lango
 * - poilsio metu rodoma: „Poilsis“ viršuje, apačioje – „Kitas:“ + sekantis pratimas
 * - nustatymai auto-pauzina
 * - viso seanso fonas baltas (stabilus)
 */
export default function WorkoutPlayer({ workoutData, planId, onClose }) {
  const { t, i18n } = useTranslation("common");

  // ---- STATE ----
  const [phase, setPhase] = useState("intro"); // intro | run | summary
  const [currentDay, setCurrentDay] = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inputActive, setInputActive] = useState(false); // apsauga uždarymui/karštiesiems klavišams
  const [showSettings, setShowSettings] = useState(false);

  // Feedback
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Nustatymai
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundFxEnabled, setSoundFxEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [vibrationSupported, setVibrationSupported] = useState(false);

  // ---- REF’ai ----
  const deadlineRef = useRef(null);          // epoch ms, kada step baigiasi
  const remainMsRef = useRef(null);          // ms likę pauzės momentu
  const tickerRef = useRef(null);            // setTimeout id
  const audioInitedRef = useRef(false);
  const lastSpokenRef = useRef(null);
  const audioRef = useRef({
    beep: null,
    silence: null,
  });

  // ---- i18n tekstai (su fallback) ----
  const restLabel = t("player.rest", { defaultValue: "Poilsis" });
  const upNextLabel = t("player.upNext", { defaultValue: i18n.language?.startsWith("lt") ? "Kitas:" : "Up next:" });
  const setWord = t("player.setWord", { defaultValue: i18n.language?.startsWith("lt") ? "Serija" : "Set" });
  const secShort = i18n.language?.startsWith("lt") ? t("player.secShortLt", { defaultValue: "sek." }) : t("player.secShortEn", { defaultValue: "sec." });
  const startWorkoutLabel = t("player.startWorkout", { defaultValue: i18n.language?.startsWith("lt") ? "Pradėti treniruotę" : "Start workout" });
  const pausedLabel = t("player.paused", { defaultValue: i18n.language?.startsWith("lt") ? "Pauzė" : "Paused" });
  const endSessionLabel = t("player.endSession", { defaultValue: i18n.language?.startsWith("lt") ? "Baigti sesiją" : "End session" });
  const motivationTitle = t("player.motivationTitle", { defaultValue: i18n.language?.startsWith("lt") ? "Motyvacija" : "Motivation" });
  const thanksForWorkingOut = t("player.thanksForWorkingOut", { defaultValue: i18n.language?.startsWith("lt") ? "Ačiū, kad sportavai!" : "Thanks for working out!" });
  const howWasDifficulty = t("player.howWasDifficulty", { defaultValue: i18n.language?.startsWith("lt") ? "Kaip įvertintum treniruotės sunkumą?" : "How would you rate the difficulty?" });
  const commentPlaceholder = t("player.commentPlaceholder", { defaultValue: i18n.language?.startsWith("lt") ? "Tavo komentaras apie treniruotę..." : "Your comment about the workout..." });
  const finishWorkout = t("player.finishWorkout", { defaultValue: i18n.language?.startsWith("lt") ? "Baigti treniruotę" : "Finish workout" });
  const thanksForFeedback = t("player.thanksForFeedback", { defaultValue: i18n.language?.startsWith("lt") ? "Ačiū už įvertinimą!" : "Thanks for your feedback!" });

  // Settings labels (naujai pridėsi į common.json)
  const settingsTitle = t("player.settings.title", { defaultValue: i18n.language?.startsWith("lt") ? "Nustatymai" : "Settings" });
  const settingsVibration = t("player.settings.vibration", { defaultValue: i18n.language?.startsWith("lt") ? "Vibracija" : "Vibration" });
  const settingsSoundFx = t("player.settings.soundFx", { defaultValue: i18n.language?.startsWith("lt") ? "Perjungimo garsas" : "Sound FX" });
  const settingsVoiceCountdown = t("player.settings.voiceCountdown", { defaultValue: i18n.language?.startsWith("lt") ? "Skaičiavimas balsu (5–1)" : "Voice countdown (5–1)" });

  // ---- DUOMENYS ----
  const day = workoutData?.days?.[currentDay];
  const exercise = day?.exercises?.[exerciseIdx];
  const step = exercise?.steps?.[stepIdx];

  const isRest = (s) => s?.type === "rest" || s?.type === "rest_after";

  // Kitas pratimas/žingsnis (poilsio metu rodymui)
  const nextInfo = useMemo(() => {
    if (!day) return null;
    let e = exerciseIdx;
    let s = stepIdx;

    // jeigu dar yra žingsnių šiame pratime – pereinam į sekantį žingsnį
    if (exercise?.steps && s + 1 < exercise.steps.length) {
      s += 1;
    } else {
      // kitas pratimas
      if (e + 1 < day.exercises.length) {
        e += 1;
        s = 0;
      } else {
        return null;
      }
    }
    const ex = day.exercises[e];
    const st = ex?.steps?.[s];
    return {
      name: ex?.name ?? "",
      desc: ex?.description ?? "",
      setLabel: st?.set ? `${setWord} ${st.set}` : null,
      isRest: isRest(st),
    };
  }, [day, exerciseIdx, stepIdx, exercise, setWord]);

  // ---- TIMER ----
  const clearTicker = () => {
    if (tickerRef.current) {
      clearTimeout(tickerRef.current);
      tickerRef.current = null;
    }
  };

  const tick = () => {
    if (!deadlineRef.current) return;
    const now = Date.now();
    const msLeft = Math.max(0, deadlineRef.current - now);
    const secs = Math.ceil(msLeft / 1000);
    setSecondsLeft((prev) => (prev !== secs ? secs : prev));

    // 5..1 skaičiavimas
    if (!paused && secs > 0 && secs <= 5 && voiceEnabled) {
      if (lastSpokenRef.current !== secs) {
        speakNumber(secs);
        lastSpokenRef.current = secs;
      }
    }

    if (msLeft <= 0) {
      clearTicker();
      goNext();
      return;
    }
    tickerRef.current = setTimeout(tick, 200);
  };

  const startStep = (durationSec) => {
    lastSpokenRef.current = null;
    clearTicker();
    if (!durationSec || durationSec <= 0) {
      // jeigu žingsnis be laiko – iškart sekantis
      goNext();
      return;
    }
    setPaused(false);
    const now = Date.now();
    deadlineRef.current = now + durationSec * 1000;
    setSecondsLeft(durationSec);
    tickerRef.current = setTimeout(tick, 200);

    // vibracija/„beep“ tik perjungimo momentu
    buzz();
    ping();
  };

  const pause = () => {
    if (paused) return;
    setPaused(true);
    clearTicker();
    if (deadlineRef.current) {
      remainMsRef.current = Math.max(0, deadlineRef.current - Date.now());
    }
  };

  const resume = () => {
    if (!paused) return;
    setPaused(false);
    const ms = remainMsRef.current ?? 0;
    deadlineRef.current = Date.now() + ms;
    lastSpokenRef.current = null; // kad sklandžiai perskaičiuotų 5..1
    tickerRef.current = setTimeout(tick, 200);
  };

  // ---- NAVIGACIJA ----
  const goNext = () => {
    // sekantis žingsnis/pratimas/diena
    if (exercise?.steps && stepIdx + 1 < exercise.steps.length) {
      setStepIdx(stepIdx + 1);
    } else if (day?.exercises && exerciseIdx + 1 < day.exercises.length) {
      setExerciseIdx(exerciseIdx + 1);
      setStepIdx(0);
    } else {
      // viskas – į summary
      setPhase("summary");
      clearTicker();
      deadlineRef.current = null;
      setSecondsLeft(0);
      return;
    }
  };

  const goPrev = () => {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1);
    } else if (exerciseIdx > 0) {
      const prevExercise = day.exercises[exerciseIdx - 1];
      setExerciseIdx(exerciseIdx - 1);
      setStepIdx(Math.max(0, (prevExercise?.steps?.length ?? 1) - 1));
    }
  };

  // ---- AUDIO ----
  const unlockAudio = async () => {
    if (audioInitedRef.current) return;
    try {
      audioRef.current.beep = new Audio("/beep.wav");
      audioRef.current.beep.preload = "auto";
      audioRef.current.beep.volume = 0.75;

      // palaikau abu pavadinimus – „silance.mp3“ ir „silence.mp3“
      audioRef.current.silence = new Audio("/silance.mp3");
      audioRef.current.silence.preload = "auto";
      audioRef.current.silence.volume = 0.001;

      await audioRef.current.silence.play().catch(async () => {
        audioRef.current.silence = new Audio("/silence.mp3");
        audioRef.current.silence.preload = "auto";
        audioRef.current.silence.volume = 0.001;
        try { await audioRef.current.silence.play(); } catch (_) {}
      });
    } catch (_) {
      // ignore
    } finally {
      audioInitedRef.current = true;
    }
  };

  const ping = () => {
    if (!soundFxEnabled) return;
    const a = audioRef.current.beep;
    if (a) {
      try {
        a.currentTime = 0;
        a.play();
      } catch (_) {}
    }
  };

  const speakNumber = (n) => {
    // bandome balsą; jei nėra – ping()
    const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
    if (canSpeak) {
      try {
        const u = new SpeechSynthesisUtterance(String(n));
        // LT/EN balsai – OS parinks pagal kalbą
        u.lang = i18n.language?.startsWith("lt") ? "lt-LT" : "en-US";
        u.rate = 1.1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        return;
      } catch (_) {
        // fallback to beep
      }
    }
    ping();
  };

  const buzz = () => {
    if (!vibrationEnabled || !vibrationSupported) return;
    try { navigator.vibrate?.(30); } catch (_) {}
  };

  // ---- EFFECTS ----
  useEffect(() => {
    setVibrationSupported(!!navigator.vibrate);
  }, []);

  // perkraunant step – paleidžiam laikmatį
  useEffect(() => {
    if (phase !== "run") return;
    const s = step;
    // iš teksto pasiimam sekundes, jei nėra duration lauko
    const duration =
      typeof s?.duration === "number"
        ? s.duration
        : parseFromTextToSec(s?.time || s?.description || "");
    startStep(duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIdx, exerciseIdx]);

  // kai atidarai nustatymus – pauzė
  useEffect(() => {
    if (showSettings && phase === "run" && !paused) pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings]);

  // klaviatūros valdymas (atjungiam kai aktyvus įvesties laukas ar settings)
  useEffect(() => {
    const onKey = (e) => {
      if (inputActive || showSettings) return;
      if (phase !== "run") return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        paused ? resume() : pause();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, phase, inputActive, showSettings, stepIdx, exerciseIdx]);

  // ---- HELPERS ----
  const parseFromTextToSec = (text) => {
    if (!text) return 0;
    const m = String(text).match(/(\d+)\s*(sek|sec|\.)?/i);
    return m ? parseInt(m[1], 10) : 0;
  };

  const startWorkout = async () => {
    await unlockAudio();
    setPhase("run");
    setExerciseIdx(0);
    setStepIdx(0);
  };

  const togglePause = () => (paused ? resume() : pause());

  const safeClose = () => {
    if (inputActive) return; // kai rašai komentarą – neleidžiam uždaryti
    clearTicker();
    onClose?.();
  };

  // ---- UI BLOKAI ----
  const TopBar = () => (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto px-4 pt-4">
      <button
        aria-label="Close"
        onClick={safeClose}
        className={`p-2 rounded-xl hover:bg-gray-100 transition ${inputActive ? "pointer-events-none opacity-50" : ""}`}
        title="Power"
      >
        <Power size={22} />
      </button>
      <div className="text-sm text-gray-500">{paused ? `• ${pausedLabel}` : ""}</div>
      <button
        aria-label="Settings"
        onClick={() => setShowSettings((v) => !v)}
        className="p-2 rounded-xl hover:bg-gray-100 transition"
        title="Settings"
      >
        <Settings size={22} />
      </button>
    </div>
  );

  const SettingsPanel = () =>
    showSettings ? (
      <div className="mt-3 w-full max-w-2xl mx-auto px-4">
        <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
          <div className="font-semibold mb-2">{settingsTitle}</div>
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span>{settingsVibration}</span>
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>{settingsSoundFx}</span>
              <input
                type="checkbox"
                checked={soundFxEnabled}
                onChange={(e) => setSoundFxEnabled(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between">
              <span>{settingsVoiceCountdown}</span>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>
    ) : null;

  const Intro = () => (
    <div className="flex flex-col items-center justify-center text-center flex-1">
      <h1 className="text-2xl font-semibold mb-2">{motivationTitle}</h1>
      <p className="text-gray-500 max-w-md">
        {i18n.language?.startsWith("lt")
          ? "Pasiruošk! Susitelk į kvėpavimą, laikyseną ir techniką."
          : "Get ready! Focus on breathing, posture, and technique."}
      </p>
      <button
        onClick={startWorkout}
        className="mt-6 px-6 py-3 rounded-2xl bg-black text-white hover:bg-gray-800 transition"
      >
        {startWorkoutLabel}
      </button>
    </div>
  );

  const Run = () => {
    const isRestStep = isRest(step);
    const title = isRestStep ? restLabel : exercise?.name || t("player.exercise", { defaultValue: "Exercise" });
    const description = isRestStep
      ? nextInfo?.desc || ""
      : exercise?.description || "";

    // sekundžių spalva
    const secColor = isRestStep ? "text-yellow-500" : "text-green-600";

    return (
      <div className="flex flex-col items-center justify-start flex-1 w-full">
        <div className="mt-6 w-full max-w-2xl mx-auto px-4 text-center">
          <div className="text-xl font-semibold">{title}</div>

          {/* Serija (jei yra) */}
          {step?.set ? (
            <div className="mt-1 text-sm text-gray-500">
              {setWord} {step.set}
            </div>
          ) : null}

          {/* Aprašymas */}
          {description ? (
            <div className="mt-2 text-gray-600">{description}</div>
          ) : null}

          {/* Laikmatis */}
          <div className={`mt-6 text-6xl font-bold ${secColor}`}>
            {Math.max(0, secondsLeft)} <span className="text-base font-medium text-gray-400">{secShort}</span>
          </div>

          {/* Poilsio metu apačioje – „Kitas:“ */}
          {isRestStep && nextInfo?.name ? (
            <div className="mt-6 text-sm">
              <span className="text-gray-500">{upNextLabel} </span>
              <span className="font-medium">{nextInfo.name}</span>
              {nextInfo.setLabel ? <span className="text-gray-500"> • {nextInfo.setLabel}</span> : null}
            </div>
          ) : null}
        </div>

        {/* Valdikliai */}
        <div className="mt-8 flex items-center gap-4">
          <button
            className="p-3 rounded-2xl border hover:bg-gray-50"
            onClick={goPrev}
            aria-label="Prev"
            title={i18n.language?.startsWith("lt") ? "Atgal" : "Back"}
          >
            <SkipBack size={22} />
          </button>
          <button
            className="p-3 rounded-2xl border hover:bg-gray-50"
            onClick={togglePause}
            aria-label="Pause/Play"
            title={i18n.language?.startsWith("lt") ? "Pauzė / Tęsti" : "Pause / Play"}
          >
            {paused ? <Play size={22} /> : <Pause size={22} />}
          </button>
          <button
            className="p-3 rounded-2xl border hover:bg-gray-50"
            onClick={() => startStep(parseFromTextToSec(step?.time || step?.description || step?.duration || "0"))}
            aria-label="Restart step"
            title={i18n.language?.startsWith("lt") ? "Perkrauti žingsnį" : "Restart step"}
          >
            <RotateCcw size={22} />
          </button>
          <button
            className="p-3 rounded-2xl border hover:bg-gray-50"
            onClick={goNext}
            aria-label="Next"
            title={i18n.language?.startsWith("lt") ? "Pirmyn" : "Next"}
          >
            <SkipForward size={22} />
          </button>
        </div>

        {/* Baigti sesiją – atskirai, žemiau */}
        <div className="mt-6">
          <button
            className="px-5 py-2 rounded-2xl border border-gray-300 hover:bg-gray-50"
            onClick={() => setPhase("summary")}
          >
            {endSessionLabel}
          </button>
        </div>
      </div>
    );
  };

  const Summary = () => (
    <div className="flex flex-col items-center justify-start flex-1 w-full">
      <div className="mt-6 w-full max-w-2xl mx-auto px-4 text-center">
        <div className="text-2xl font-semibold">{t("player.workoutCompleted", { defaultValue: i18n.language?.startsWith("lt") ? "Sveikiname, treniruotė baigta!" : "Workout completed!" })}</div>
        <div className="text-gray-600 mt-2">{thanksForWorkingOut}</div>

        <div className="mt-6 text-left w-full max-w-xl mx-auto">
          <div className="font-medium mb-2">{howWasDifficulty}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`px-3 py-2 rounded-xl border ${rating === n ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}
                onClick={() => setRating(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <textarea
              rows={4}
              className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-black/10"
              placeholder={commentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={() => setInputActive(true)}
              onBlur={() => setInputActive(false)}
              onKeyDown={(e) => e.stopPropagation()} // NELEIDŽIAM karštųjų klavišų prasimušti
            />
          </div>

          <div className="mt-4">
            <button
              disabled={submitting || submitted}
              className={`px-5 py-3 rounded-2xl ${submitted ? "bg-green-600 text-white" : "bg-black text-white hover:bg-gray-800"} transition`}
              onClick={async () => {
                if (submitted) return;
                setSubmitting(true);
                try {
                  await fetch("/api/complete-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      planId,
                      difficultyRating: rating,
                      userComment: comment?.trim() || null,
                    }),
                  });
                  setSubmitted(true);
                } catch (_) {
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitted ? thanksForFeedback : finishWorkout}
            </button>
          </div>

          <div className="mt-6">
            <button
              className="px-5 py-2 rounded-2xl border border-gray-300 hover:bg-gray-50"
              onClick={safeClose}
            >
              {t("close", { defaultValue: i18n.language?.startsWith("lt") ? "Uždaryti" : "Close" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ---- RENDER ----
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <TopBar />
      <SettingsPanel />
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        {phase === "intro" ? <Intro /> : phase === "run" ? <Run /> : <Summary />}
      </div>
    </div>
  );
}
