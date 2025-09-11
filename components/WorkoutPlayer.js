import { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { SkipBack, SkipForward, Pause, Play, RotateCcw, Settings, Power, Info } from "lucide-react";
import { useTranslation } from "next-i18next";

export default function WorkoutPlayer({ workoutData, planId, onClose }) {
  const { t: tr, i18n } = useTranslation("common");
  const router = (typeof window !== "undefined" ? useRouter() : null);
  const isIOS = typeof navigator !== "undefined" && /iP(hone|ad|od)/i.test(navigator.userAgent);

  // ---- iOS scroll lock while typing ----
  const pageYRef = useRef(0);
  const lockBodyScroll = () => {
    try {
      pageYRef.current = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${pageYRef.current}px`;
      document.body.style.overscrollBehavior = "contain";
      document.documentElement.style.overscrollBehavior = "contain";
    } catch {}
  };
  const unlockBodyScroll = () => {
    try {
      const y = pageYRef.current || 0;
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      document.body.style.overscrollBehavior = "";
      document.documentElement.style.overscrollBehavior = "";
      window.scrollTo(0, y);
    } catch {}
  };

  // ---- State ----
  const [currentDay] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState("intro"); // intro | exercise | summary
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stepFinished, setStepFinished] = useState(false);

  const [rating, setRating] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Settings (persisted)
  const [showSettings, setShowSettings] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [fxEnabled, setFxEnabled] = useState(true);
  const [fxTrack, setFxTrack] = useState("beep");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [descriptionsEnabled, setDescriptionsEnabled] = useState(true);
  const [vibrationSupported, setVibrationSupported] = useState(false);

  // Apsauga: kai aktyvus įvesties laukas – neleidžiam „Power“
  const [inputActive, setInputActive] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  // ---- Refs ----
  const wakeLockRef = useRef(null);
  const textareaRef = useRef(null);
  const caretRef = useRef({ start: null, end: null });
  const commentRef = useRef("");

  // Timer
  const tickRafRef = useRef(null);
  const lastTickRef = useRef(0);
  const deadlineRef = useRef(null);
  const remainMsRef = useRef(null);

  const timeoutsRef = useRef([]);

  // Scroll
  const scrollRef = useRef(null);
  const lastYRef = useRef(0);
  const saveScroll = () => (scrollRef.current ? scrollRef.current.scrollTop : 0);
  const restoreScroll = (y) => {
    const el = scrollRef.current;
    if (el) el.scrollTop = y;
  };
  useEffect(() => {
    if (!isIOS) return;
    if (inputActive) lockBodyScroll();
    else unlockBodyScroll();
    return () => {
      if (isIOS) unlockBodyScroll();
    };
  }, [isIOS, inputActive]);

  useEffect(() => {
    try {
      commentRef.current = "";
    } catch {}
  }, []);

  useLayoutEffect(() => {
    if (inputActive && textareaRef.current) {
      try {
        const el = textareaRef.current;
        const { start, end } = caretRef.current || {};
        if (start != null && end != null) el.setSelectionRange(start, end);
      } catch {}
    }
  }, [inputActive]);

  // AUDIO
  const audioRef = useRef({
    html: { loaded: false, beep: null, silence: null, nums: {} },
    wa: { ctx: null, ready: false, buffers: new Map(), scheduled: [] },
  });
  const lastSpokenRef = useRef(null);

  // Derived
  const day = workoutData?.days?.[currentDay];
  const [preStartSeconds, setPreStartSeconds] = useState(10);
  const justFromGetReadyRef = useRef(false);

  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  const isLastExerciseInDay = !!day && currentExerciseIndex === (day?.exercises?.length || 1) - 1;
  const isLastStepInExercise = !!exercise && currentStepIndex === (exercise?.steps?.length || 1) - 1;

  // nauji aiškūs indikatoriai pabaigai
  const isTerminal = isLastExerciseInDay && isLastStepInExercise;
  const isRestAfter = step?.type === "rest_after";

  // i18n labels
  const restLabel = tr("player.rest", { defaultValue: "Rest" });
  const upNextLabel = tr("player.upNext", { defaultValue: "Up next:" });
  const setWord = tr("player.setWord", { defaultValue: "Set" });
  const secShort = tr("player.secShort", { defaultValue: i18n.language?.startsWith("lt") ? "sek" : "sec" });
  const startWorkoutLabel = tr("player.startWorkout", { defaultValue: "Start workout" });
  const doneLabel = tr("player.done", { defaultValue: "Done" });
  const prevLabel = tr("player.prev", { defaultValue: "Previous" });
  const nextLabel = tr("player.next", { defaultValue: "Next" });
  const pausePlayLabel = tr("player.pausePlay", { defaultValue: "Pause / Play" });
  const restartStepLabel = tr("player.restartStep", { defaultValue: "Restart step" });
  const endSessionLabel = tr("player.endSession", { defaultValue: "End session" });
  const pausedLabel = tr("player.paused", { defaultValue: "Paused" });
  const workoutCompletedLabel = tr("player.workoutCompleted", { defaultValue: "Workout complete!" });
  const thanksForWorkingOut = tr("player.thanksForWorkingOut", { defaultValue: "Thanks for working out!" });
  const howWasDifficulty = tr("player.howWasDifficulty", { defaultValue: "How was the difficulty?" });
  const commentPlaceholder = tr("player.commentPlaceholder", { defaultValue: "Comment (optional)..." });
  const finishWorkout = tr("player.finishWorkout", { defaultValue: "Finish and send feedback" });
  const thanksForFeedback = tr("player.thanksForFeedback", { defaultValue: "Thanks for the feedback!" });
  const exerciseLabel = tr("player.exercise", { defaultValue: "Exercise" });
  const motivationTitle = tr("player.motivationTitle", { defaultValue: "Motivation" });

  // ---- Utils ----
  function getTimedSeconds(st) {
    const n1 = Number(st?.durationTime);
    if (Number.isFinite(n1) && n1 > 0) return Math.round(n1);

    const sources = [st?.duration, st?.duration_label, st?.label, st?.description];
    for (const s of sources) {
      if (typeof s !== "string") continue;
      const low = s.toLowerCase();
      const mentionsSeconds = low.includes("sek") || low.includes("sec") || low.includes(" sekund");
      if (!mentionsSeconds) continue;
      const digits = Array.from(s).filter((ch) => ch >= "0" && ch <= "9").join("");
      const v = parseInt(digits, 10);
      if (Number.isFinite(v) && v > 0) return v;
    }
    return 0;
  }

  function getReps(st) {
    const cand = st?.durationQuantity ?? st?.reps ?? st?.repeat ?? st?.repetitions ?? st?.count ?? st?.quantity;
    const n1 = Number(cand);
    if (Number.isFinite(n1) && n1 > 0) return Math.round(n1);

    const sources = [st?.duration, st?.label, st?.description];
    for (const s of sources) {
      if (typeof s !== "string") continue;
      const low = s.toLowerCase();
      const looksLikeReps = low.includes("kart") || low.includes("rep") || low.includes("x");
      if (!looksLikeReps) continue;

      let v = NaN;
      const idxX = low.indexOf("x");
      if (idxX >= 0) {
        const after = Array.from(low.slice(idxX + 1)).filter((ch) => ch >= "0" && ch <= "9").join("");
        const beforeDigits = Array.from(low.slice(0, idxX)).filter((ch) => ch >= "0" && ch <= "9").join("");
        const vAfter = parseInt(after, 10);
        const vBefore = parseInt(beforeDigits, 10);
        if (Number.isFinite(vAfter)) v = vAfter;
        else if (Number.isFinite(vBefore)) v = vBefore;
      }
      if (!Number.isFinite(v)) {
        const digits = Array.from(s).filter((ch) => ch >= "0" && ch <= "9").join("");
        v = parseInt(digits, 10);
      }
      if (Number.isFinite(v) && v > 0) return v;
    }
    return null;
  }

  // Show reps text as it is in AI text, if available
  function getRepsText(st) {
    const n = getReps(st);
    if (n == null) return "";

    const preferred = [st?.duration, st?.duration_label, st?.label, st?.description];
    for (const s of preferred) {
      if (typeof s !== "string") continue;
      if (s.includes(String(n))) return s.trim();
    }

    if (i18n?.language?.startsWith("lt")) {
      const form = n === 1 ? "kartą" : "kartų";
      return `${n} ${form}`;
    }
    return `${n} reps`;
  }

  function clearAllTimeouts() {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }

  // --------- AUDIO (WebAudio + fallback) ----------
  async function ensureWAContext() {
    if (audioRef.current.wa.ctx) return audioRef.current.wa.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    audioRef.current.wa.ctx = ctx;
    return ctx;
  }

  async function loadWABuffer(name, url) {
    try {
      const ctx = await ensureWAContext();
      if (!ctx) return false;
      if (audioRef.current.wa.buffers.has(name)) return true;
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      audioRef.current.wa.buffers.set(name, buf);
      return true;
    } catch {
      return false;
    }
  }

  function playWABuffer(name, when = 0) {
    try {
      const { ctx, buffers, scheduled } = audioRef.current.wa;
      if (!ctx) return false;
      const buf = buffers.get(name);
      if (!buf) return false;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const startAt = ctx.currentTime + Math.max(0, when);
      src.start(startAt);
      scheduled.push({ source: src, when: startAt });
      src.onended = () => {
        const i = scheduled.findIndex((s) => s.source === src);
        if (i >= 0) scheduled.splice(i, 1);
      };
      return true;
    } catch {
      return false;
    }
  }

  function stopAllScheduled() {
    const { scheduled } = audioRef.current.wa;
    scheduled.forEach((s) => {
      try {
        s.source.stop(0);
      } catch {}
    });
    audioRef.current.wa.scheduled = [];
  }

  function ensureHTMLAudioLoaded() {
    if (audioRef.current.html.loaded) return;
    const beep = new Audio("/beep.wav");
    const silence = new Audio("/silance.mp3");
    const nums = {
      1: new Audio("/1.mp3"),
      2: new Audio("/2.mp3"),
      3: new Audio("/3.mp3"),
      4: new Audio("/4.mp3"),
      5: new Audio("/5.mp3"),
    };
    try {
      beep.load();
      Object.values(nums).forEach((a) => {
        try {
          a.load();
        } catch {}
      });
    } catch {}
    audioRef.current.html = { loaded: true, beep, silence, nums };
  }

  function playHTML(name) {
    ensureHTMLAudioLoaded();
    const { beep, nums } = audioRef.current.html;
    if (name === "beep") {
      try {
        beep.currentTime = 0;
        beep.volume = 0.75;
        beep.play();
      } catch {}
      return true;
    }
    if (["1", "2", "3", "4", "5"].includes(name)) {
      const a = nums[Number(name)];
      try {
        a.currentTime = 0;
        a.play();
      } catch {}
      return true;
    }
    return false;
  }

  async function primeIOSAudio() {
    const ctx = await ensureWAContext();
    try {
      await ctx?.resume();
    } catch {}

    await Promise.all([
      loadWABuffer("beep", "/beep.wav"),
      loadWABuffer("1", "/1.mp3"),
      loadWABuffer("2", "/2.mp3"),
      loadWABuffer("3", "/3.mp3"),
      loadWABuffer("4", "/4.mp3"),
      loadWABuffer("5", "/5.mp3"),
    ]);

    ensureHTMLAudioLoaded();
    try {
      const s = audioRef.current.html.silence;
      s.volume = 0.01;
      s.currentTime = 0;
      await s.play().catch(() => {});
      setTimeout(() => {
        try {
          s.pause();
          s.currentTime = 0;
        } catch {}
      }, 120);
    } catch {}
  }

  function ping() {
    if (!fxEnabled) return;
    const waOk = playWABuffer("beep", 0);
    if (!waOk) playHTML("beep");
  }

  function speakNumber(n) {
    const ok = playWABuffer(String(n), 0);
    if (ok) return;
    const ok2 = playHTML(String(n));
    if (ok2) return;
    if (voiceEnabled && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance(String(n));
        u.lang = i18n.language?.startsWith("lt") ? "lt-LT" : "en-US";
        u.rate = 1.05;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch {}
    } else {
      ping();
    }
  }

  function vibe(pattern = [40, 40]) {
    if (!vibrationEnabled) return;
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

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
          const totalSets = ex.steps?.filter((s) => s.type === "exercise").length || 0;
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

  // WakeLock
  useEffect(() => {
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((lock) => (wakeLockRef.current = lock)).catch(() => {});
    }
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      setVibrationSupported(typeof navigator !== "undefined" && "vibrate" in navigator);
      const v = localStorage.getItem("bs_vibration_enabled");
      if (v != null) setVibrationEnabled(v === "true");
      const f = localStorage.getItem("bs_fx_enabled");
      if (f != null) setFxEnabled(f === "true");
      const ft = localStorage.getItem("bs_fx_track");
      if (ft) setFxTrack(ft);
      const vo = localStorage.getItem("bs_voice_enabled");
      if (vo != null) setVoiceEnabled(vo === "true");
      const de = localStorage.getItem("bs_descriptions_enabled");
      if (de != null) setDescriptionsEnabled(de === "true");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const ps = localStorage.getItem("bs_prestart_seconds");
      if (ps != null && !Number.isNaN(Number(ps))) setPreStartSeconds(Math.max(0, parseInt(ps, 10)));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("bs_vibration_enabled", String(vibrationEnabled));
    } catch {}
  }, [vibrationEnabled]);
  useEffect(() => {
    try {
      localStorage.setItem("bs_fx_enabled", String(fxEnabled));
    } catch {}
  }, [fxEnabled]);
  useEffect(() => {
    try {
      localStorage.setItem("bs_fx_track", fxTrack);
    } catch {}
  }, [fxTrack]);
  useEffect(() => {
    try {
      localStorage.setItem("bs_voice_enabled", String(voiceEnabled));
    } catch {}
  }, [voiceEnabled]);
  useEffect(() => {
    try {
      localStorage.setItem("bs_descriptions_enabled", String(descriptionsEnabled));
    } catch {}
  }, [descriptionsEnabled]);

  
  useEffect(() => {
    try {
      localStorage.setItem("bs_prestart_seconds", String(preStartSeconds));
    } catch {}
  }, [preStartSeconds]);
// TIMER
  const cancelRaf = () => {
    if (tickRafRef.current) cancelAnimationFrame(tickRafRef.current);
    tickRafRef.current = null;
  };

  const tick = (nowMs) => {
    if (!deadlineRef.current) return;
    if (!lastTickRef.current || nowMs - lastTickRef.current > 80) {
      const msLeft = Math.max(0, deadlineRef.current - nowMs);
      const secs = Math.ceil(msLeft / 1000);
      setSecondsLeft((prev) => (prev !== secs ? secs : prev));

      if (!paused && voiceEnabled && secs > 0 && secs <= 5) {
        if (lastSpokenRef.current !== secs) {
          speakNumber(secs);
          lastSpokenRef.current = secs;
        }
      }

      if (msLeft <= 0) {
        cancelRaf();
        lastSpokenRef.current = null;
        setStepFinished(true);
        handlePhaseComplete();
        return;
      }
      lastTickRef.current = nowMs;
    }
    tickRafRef.current = requestAnimationFrame(tick);
  };

  const startTimedStep = (durationSec) => {
    cancelRaf();
    stopAllScheduled();
    lastSpokenRef.current = null;

    if (!durationSec || durationSec <= 0) {
      setSecondsLeft(0);
      setWaitingForUser(true);
      return;
    }
    setWaitingForUser(false);
    setPaused(false);

    const nowMs = performance.now();
    deadlineRef.current = nowMs + durationSec * 1000;
    setSecondsLeft(durationSec);

    vibe([40, 40]);
    ping();

    tickRafRef.current = requestAnimationFrame(tick);
  };

  const pauseTimer = () => {
    if (paused) return;
    setPaused(true);
    if (deadlineRef.current) remainMsRef.current = Math.max(0, deadlineRef.current - performance.now());
    cancelRaf();
    stopAllScheduled();
  };

  const resumeTimer = () => {
    if (!paused) return;
    setPaused(false);
    if (remainMsRef.current != null) {
      lastSpokenRef.current = null;
      deadlineRef.current = performance.now() + remainMsRef.current;
      tickRafRef.current = requestAnimationFrame(tick);
    }
  };

  // --- GET READY COUNTDOWN ---
  function startGetReadyCountdown(durationSec) {
    cancelRaf();
    stopAllScheduled();
    if (!durationSec || durationSec <= 0) {
      justFromGetReadyRef.current = true;
      setPhase("exercise");
      return;
    }
    // initialize countdown
    remainMsRef.current = durationSec * 1000;
    const startAt = performance.now();
    deadlineRef.current = startAt + remainMsRef.current;
    setSecondsLeft(Math.max(0, Math.ceil(remainMsRef.current / 1000)));
    setWaitingForUser(false);
    setPaused(false);

    const tick = (now) => {
      if (paused) {
        tickRafRef.current = requestAnimationFrame(tick);
        return;
      }
      const remain = Math.max(0, deadlineRef.current - now);
      remainMsRef.current = remain;
      const secs = Math.ceil(remain / 1000);
      setSecondsLeft(secs);
      if (remain <= 0) {
        cancelRaf();
        justFromGetReadyRef.current = true;
        setPhase("exercise");
        return;
      }
      tickRafRef.current = requestAnimationFrame(tick);
    };
    tickRafRef.current = requestAnimationFrame(tick);
  }

  function maybeStartGetReady() {
    try {
      const sec = Number(preStartSeconds);
      if (!Number.isFinite(sec) || sec <= 0) return false;
      startGetReadyCountdown(Math.max(0, Math.round(sec)));
      setPhase("getready");
      return true;
    } catch {
      return false;
    }
  }

  // --- TIMER SETUP / STEP SWITCH ---
  useEffect(() => {
      // Don't interfere with one-time pre-start countdown
  if (phase === "getready") return;
  cancelRaf();
  stopAllScheduled();
  deadlineRef.current = null;
// Don't interfere with the one-time pre-start countdown
    if (phase === "getready") return;

if (phase !== "exercise" || !step) {
      setSecondsLeft(0);
      setWaitingForUser(false);
      return;
    }

    const duration = getTimedSeconds(step);

    // Paskutinis žingsnis yra rest_after
    if (isTerminal && isRestAfter) {
      if (duration > 0) {
        // leisti suveikti poilsio laikui ir tada pereiti į summary
        startTimedStep(duration);
      } else {
        // nėra trukmės – iškart į summary
        setSecondsLeft(0);
        setWaitingForUser(false);
        setTimeout(() => setPhase("summary"), 0);
      }
      return;
    }

    // Įprasta eiga: timed -> timeris; reps -> „Atlikta“
    if (duration > 0) {
      startTimedStep(duration);
    } else {
      setSecondsLeft(0);
      setWaitingForUser(step?.type === "exercise");
    }
  }, [phase, step, currentExerciseIndex, currentStepIndex, isTerminal, isRestAfter]); // eslint-disable-line react-hooks/exhaustive-deps

  
  // automatinė pauzė atidarius nustatymus ar išeities patvirtinimą
  useEffect(() => {
    if (showSettings) pauseTimer();
  }, [showSettings]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (showConfirmExit) pauseTimer();
  }, [showConfirmExit]);

  useEffect(() => {
    setStepFinished(false);
  }, [currentStepIndex, currentExerciseIndex]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      cancelRaf();
      stopAllScheduled();
    };
  }, []);

  // Watchdog: jei kažkas „dingo“, užbaik
  useEffect(() => {
    if (phase === "exercise") {
      if (!day || !exercise || !step) setPhase("summary");
    }
  }, [phase, day, exercise, step]);

  // Navigation
  function handleManualContinue() {
    cancelRaf();
    stopAllScheduled();
    if (phase === "intro") { primeIOSAudio(); if (!maybeStartGetReady()) { setPhase("exercise"); } } else if (phase === "exercise") {
      setStepFinished(true);
      handlePhaseComplete();
    } else if (phase === "summary") {
      onClose?.();
    }
  }

  function handlePhaseComplete() {
    cancelRaf();
    stopAllScheduled();

    if (exercise && step && currentStepIndex + 1 < exercise.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }
    if (day && currentExerciseIndex + 1 < day.exercises.length) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentStepIndex(0);
      return;
    }
    setPhase("summary");
  }

  function goToPrevious() {
    cancelRaf();
    stopAllScheduled();
    if (step && currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
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
      // dar yra žingsnių tame pačiame pratime
      setCurrentStepIndex((prev) => prev + 1);
    } else if (day && currentExerciseIndex + 1 < day.exercises.length) {
      // žingsnių nebėra, bet yra kitas pratimas
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentStepIndex(0);
    } else {
      // nebėra nei žingsnių, nei pratimų — einame į apibendrinimą
      setPhase("summary");
    }
  }
  function restartCurrentStep() {
    cancelRaf();
    stopAllScheduled();
    const duration = getTimedSeconds(step);
    if (duration > 0) startTimedStep(duration);
  }

  // ============== UI ==============
  const HeaderBar = () => (
    <div className="h-12 px-3 flex items-center justify-end gap-2 border-b bg-white sticky top-0 z-50">
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 shadow"
        aria-label={tr("common.settings", { defaultValue: "Settings" })}
        title={tr("common.settings", { defaultValue: "Settings" })}
      >
        <Settings className="w-5 h-5" />
      </button>
      <button
        onClick={() => {
          if (!inputActive) setShowConfirmExit(true);
        }}
        className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 shadow ${inputActive ? "pointer-events-none opacity-50" : ""}`}
        aria-label={tr("common.close", { defaultValue: "Close" })}
        title={tr("common.close", { defaultValue: "Close" })}
      >
        <Power className="w-5 h-5" />
      </button>
    </div>
  );

  const Shell = ({ children, footer }) => (
    <div className="fixed inset-0 bg-white text-gray-900 flex flex-col z-40">
      <HeaderBar />
      <div
        ref={scrollRef}
        onScroll={(e) => {
          lastYRef.current = e.currentTarget.scrollTop;
        }}
        className={`flex-1 overscroll-contain p-6 pt-8 ${isIOS && inputActive ? "overflow-hidden" : "overflow-auto"}`}
        style={isIOS && inputActive ? { WebkitOverflowScrolling: "auto" } : { WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
      {footer ? <div className="border-t p-4 sticky bottom-0 bg-white">{footer}</div> : null}

      {/* Settings modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-xl font-bold mb-4">{tr("common.settings", { defaultValue: "Settings" })}</h3>
            {/* Pre-start countdown */}
            <div className="mb-4">
              <label className="font-medium block mb-1">{tr("player.preStartSeconds", { defaultValue: "Pre-start countdown (s)" })}</label>
              <p className="text-sm text-gray-500 mb-2">{tr("player.preStartSecondsHint", { defaultValue: "How many seconds to count down before STARTING the workout." })}</p>
              <input
                type="number"
                min="0"
                step="1"
                value={preStartSeconds}
                onChange={(e) => setPreStartSeconds(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-28 px-3 py-2 border rounded-lg"
                aria-label={tr("player.preStartSeconds", { defaultValue: "Pre-start countdown (s)" })}
              />
            </div>


            {/* Vibracija */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{tr("player.vibration", { defaultValue: "Vibration" })}</p>
                <p className="text-sm text-gray-500">{tr("player.vibrationDesc", { defaultValue: "Vibrate when switching exercise/rest." })}</p>
              </div>
              <button
                onClick={() => setVibrationEnabled((v) => !v)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${vibrationEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                {vibrationEnabled ? tr("common.on", { defaultValue: "On" }) : tr("common.off", { defaultValue: "Off" })}
              </button>
            </div>
            {!vibrationSupported && (
              <div className="text-xs text-amber-600 mb-4">
                {tr("player.vibrationNotSupported", { defaultValue: "Vibration isn't supported on this device." })}
              </div>
            )}

            {/* Perjungimo garsas */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{tr("player.fx", { defaultValue: "Switch sound" })}</p>
                  <p className="text-sm text-gray-500">{tr("player.fxDesc", { defaultValue: "Play when switching exercise/rest." })}</p>
                </div>
                <button
                  onClick={() => setFxEnabled((v) => !v)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${fxEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
                >
                  {fxEnabled ? tr("common.on", { defaultValue: "On" }) : tr("common.off", { defaultValue: "Off" })}
                </button>
              </div>
              <div className="mt-2">
                <label className="text-sm mr-2">{tr("player.fxTrack", { defaultValue: "Track:" })}</label>
                <select value={fxTrack} onChange={(e) => setFxTrack(e.target.value)} className="border rounded px-2 py-1 text-sm">
                  <option value="beep">beep.wav</option>
                  <option value="silence">silance.mp3</option>
                </select>
                <button onClick={() => { ping(); }} className="ml-3 px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                  {tr("player.testFx", { defaultValue: "Test" })}
                </button>
              </div>
            </div>

            {/* Balso skaičiavimas (5..1) */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{tr("player.voice", { defaultValue: "Voice countdown" })}</p>
                <p className="text-sm text-gray-500">
                  {tr("player.voiceDescShort", { defaultValue: "Count 5,4,3,2,1 in the final seconds." })}
                </p>
              </div>
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${voiceEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                {voiceEnabled ? tr("common.on", { defaultValue: "On" }) : tr("common.off", { defaultValue: "Off" })}
              </button>
            </div>
                        {/* Descriptions toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{tr("player.descriptions", { defaultValue: "Exercise descriptions" })}</p>
                <p className="text-sm text-gray-500">{tr("player.descriptionsDescShort", { defaultValue: "Show description under the title." })}</p>
              </div>
              <button
                onClick={() => setDescriptionsEnabled(v => !v)}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${descriptionsEnabled ? "bg-green-600 text-white" : "bg-gray-200"}`}
              >
                {descriptionsEnabled ? tr("common.on", { defaultValue: "On" }) : tr("common.off", { defaultValue: "Off" })}
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => { primeIOSAudio(); }} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">
                {tr("player.primeAudio", { defaultValue: "Prime audio" })}
              </button>
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                {tr("common.close", { defaultValue: "Close" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Exit modal */}
      {showConfirmExit && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-xl font-bold mb-3">
              {tr("player.confirmExitTitle", { defaultValue: "Exit the workout?" })}
            </h3>
            <p className="text-sm text-gray-700 mb-5">
              {tr("player.confirmExitBody", {
                defaultValue: "If you exit now, this session will not be counted as completed."
              })}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                {tr("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button
                onClick={() => {
                  try { cancelRaf(); stopAllScheduled(); } catch {}
                  setShowConfirmExit(false);
                  onClose?.();
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {tr("player.confirmExitCta", { defaultValue: "Exit" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- Intro ----
  if (phase === "intro") {
    return (
      <Shell
        footer={
          <div className="flex flex-col items-center gap-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold" onClick={handleManualContinue}>
              {startWorkoutLabel}
            </button>
          </div>
        }
      >
        <div className="w-full min-h_[60vh] grid place-items-center">
          <div className="max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold mb-4">💡 {motivationTitle}</h2>
            <p className="text-base whitespace-pre-wrap leading-relaxed">{workoutData?.days?.[0]?.motivationStart || ""}</p>
          </div>
        </div>
      </Shell>
    );
  }

  
  // ---- Get Ready ----
  // ---- Get Ready ----
  if (phase === "getready") {
  // Resolve the upcoming first exercise step for display
  const upcoming = (() => {
    let ex = exercise || (day?.exercises?.[0] || null);
    let st = step;
    if (ex && (!st || st.type !== "exercise")) {
      const list = Array.isArray(ex?.steps) ? ex.steps : [];
      const firstEx = list.find(s => s?.type === "exercise");
      st = firstEx || list[0] || null;
    }
    return { ex, st };
  })();

  const nextExName =
    (upcoming.st?.name ?? upcoming.st?.title ?? upcoming.st?.label) ??
    tr("player.exercise", { defaultValue: "Exercise" });

  const getReadyLabel = tr("player.getReady", { defaultValue: "Get ready" });
  const upNextLabel   = tr("player.upNext",   { defaultValue: "Up next:" });
  const secShort      = tr("player.secShort", { defaultValue: "s" });

  return (
    <Shell
      footer={
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => (paused ? resumeTimer() : pauseTimer())}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm"
            aria-label={tr("player.pausePlay", { defaultValue: "Pause / Play" })}
          >
            {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
          </button>
          <button
            onClick={() => { cancelRaf(); justFromGetReadyRef.current = true; setPhase("exercise"); }}
            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm"
          >
            <SkipForward className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      }
    >
      <div className="w-full min-h_[60vh] grid place-items-center">
        <div className="max-w-2xl text-center px-4">
          <p className="text-2xl font-semibold text-gray-700 mb-2">{getReadyLabel}</p>
          <p className="text-6xl font-extrabold text-blue-700 tracking-tight">
            {secondsLeft}
            {secShort ? <span className="text-2xl align-super ml-1">{secShort}</span> : null}
          </p>

          <div className="mt-6 text-gray-700">
            <p className="uppercase text-xs tracking-wide text-gray-500">{upNextLabel}</p>
            <p className="text-xl font-bold mt-1">{nextExName}</p>
            {(() => {
              const reps = getReps(upcoming.st);
              if (reps > 0) {
                const setWord  = tr("player.setWord", { defaultValue: "Set" });
                const repsWord = tr("player.reps",    { defaultValue: "reps" });
                const sIdx = upcoming.st?.set ? (upcoming.st.set) : null;
                return <p className="text-lg mt-1">{reps} {repsWord}{sIdx ? ` • ${setWord} ${sIdx}` : ""}</p>;
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </Shell>
  );
// ---- Exercise / Rest ----
  if (phase === "exercise") {
    const isRestPhase = step?.type === "rest" || (step?.type === "rest_after" && !(isTerminal && isRestAfter));
    const seriesTotal = exercise?.steps?.filter((s) => s.type === "exercise").length || 0;
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
</>
        }
      >
        <div className="max-w-2xl mx-auto text-center mt-6">
          <h2 className={`text-2xl font-extrabold mb-2 ${isRestPhase ? restLabelClass : "text-gray-900"}`}>
            {isRestPhase ? restLabel : (exercise?.name || exerciseLabel)}

          {/* Description under title (toggleable) */}
          {!isRestPhase && descriptionsEnabled && exercise?.description && (
            <div className="text-sm text-gray-500 italic mb-4 flex items-start gap-2"><Info className="w-4 h-4 mt-0.5 text-gray-500" aria-hidden="true" /><span className="font-normal">{exercise.description}</span></div>
          )}

          </h2>

          {!isRestPhase && step?.type === "exercise" && (
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {setWord} {seriesIdx}/{seriesTotal}
            </p>
          )}

          

          {getTimedSeconds(step) > 0 && (
            <p className={`text-6xl font-extrabold ${timerColorClass} mt-6`}>
              {secondsLeft > 0 ? `${secondsLeft} ${secShort}` : `0 ${secShort}`}
            </p>
          )}

          {!isRestPhase && getReps(step) != null && (
            <p className="text-5xl font-extrabold text-green-700 mt-6">
              {getRepsText(step)}
            </p>
          )}

          {paused && <p className="text-red-600 font-semibold mt-2">{pausedLabel}</p>}

          {waitingForUser && step?.type === "exercise" && (
            <div className="mt-6">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold" onClick={handleManualContinue}>
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
                  {(() => {
                    const repsText = getRepsText(nextExerciseInfo.st);
                    const secs = getTimedSeconds(nextExerciseInfo.st);
                    const timedText = secs > 0 ? `${secs} ${secShort}` : "";
                    const effort = repsText || timedText;
                    return effort ? (
                      <p className="text-sm text-gray-900 mt-1">{effort}</p>
                    ) : null;
                  })()}

                  {nextExerciseInfo.setNo != null && (
                    <p className="text-sm text-gray-800 mt-1">
                      {setWord} {nextExerciseInfo.setNo}/{nextExerciseInfo.totalSets}
                    </p>
                  )}
                  {nextExerciseInfo.ex?.description && (
                    <p className="text-sm text-gray-700 italic mt-2">{nextExerciseInfo.ex.description}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600 italic">
                  {tr("player.almostFinished", { defaultValue: i18n.language?.startsWith("lt") ? "Netoli pabaigos..." : "Almost finished..." })}
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
      { value: 1, label: "😣", text: tr("player.rateTooHard", { defaultValue: "Too hard" }) },
      { value: 2, label: "😟", text: tr("player.rateAHard", { defaultValue: "A bit hard" }) },
      { value: 3, label: "😌", text: tr("player.ratePerfect", { defaultValue: "Perfect" }) },
      { value: 4, label: "🙂", text: tr("player.rateAEasy", { defaultValue: "A bit easy" }) },
      { value: 5, label: "😄", text: tr("player.rateTooEasy", { defaultValue: "Too easy" }) },
    ];

    return (
      <Shell
        footer={
          <div className="flex flex-col items-center justify-center gap-3">
            {!submitted ? (
              <button
                type="button"
                data-finish-btn="1"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className={`bg-green-600 text-white px-6 py-3 rounded-lg font-semibold ${submitting ? "opacity-70 cursor-wait" : "hover:bg-green-700"}`}
                onClick={async () => {
                  if (submitting) return;
                  const y = lastYRef.current;
                  setSubmitting(true);
                  try {
                    setInputActive(false);
                    if (isIOS) {
                      try {
                        unlockBodyScroll();
                      } catch {}
                    }
                    const rsp = await fetch("/api/complete-plan", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ planId, difficultyRating: rating, userComment: commentRef.current }),
                    });
                    if (!rsp.ok) throw new Error(`HTTP ${rsp.status}`);
                    setSubmitted(true);
                    requestAnimationFrame(() => restoreScroll(y));
                    setTimeout(() => {
                      try {
                        onClose?.();
                      } catch {}
                      try {
                        if (!onClose && router) router.push("/workouts");
                      } catch {}
                    }, 3000);
                  } catch (e) {
                    // optionally show toast
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
              >
                <span className="inline-flex items-center gap-2">
                  {submitting && (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" opacity="0.75" />
                    </svg>
                  )}
                  {finishWorkout}
                </span>
              </button>
            ) : (
              <span className="text-green-600">{thanksForFeedback}</span>
            )}
          </div>
        }
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2 text-center">🎉 {workoutCompletedLabel}</h2>
          <p className="mb-4 text-gray-800 whitespace-pre-wrap text-center">
            {workoutData?.days?.[0]?.motivationEnd || thanksForWorkingOut}
          </p>

          {workoutData?.days?.[0]?.waterRecommendation && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900 mb-3">💧 {workoutData.days[0].waterRecommendation}</div>
          )}
          {workoutData?.days?.[0]?.outdoorSuggestion && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-900 mb-3">🌿 {workoutData.days[0].outdoorSuggestion}</div>
          )}

          <p className="text-sm text-gray-700 mb-2 font-semibold">{howWasDifficulty}</p>

          <div className="flex justify-center gap-2 mb-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const y = saveScroll();
                  setRating(opt.value);
                  requestAnimationFrame(() => restoreScroll(y));
                }}
                className={`text-3xl p-1 rounded-full border-2 ${ 
                  rating === opt.value ? "border-green-600 bg-green-50" : "border-transparent"
                } hover:border-green-400`}
                type="button"
                title={opt.text}
                aria-label={opt.text}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {options.map((opt) => (
              <span key={opt.value} className={`text-xs ${rating === opt.value ? "font-bold text-green-700" : "text-gray-400"}`}>
                {opt.text}
              </span>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.stopPropagation();
              const y = lastYRef.current;
              requestAnimationFrame(() => restoreScroll(y));
            }}
            placeholder={commentPlaceholder}
            defaultValue={commentRef.current}
            onChange={(e) => {
              const el = e.target;
              caretRef.current = { start: el.selectionStart, end: el.selectionEnd };
              commentRef.current = el.value;
              const y = lastYRef.current;
              requestAnimationFrame(() => {
                if (!isIOS) {
                  try {
                    const ta = textareaRef.current;
                    if (ta) {
                      ta.focus({ preventScroll: true });
                      const c = caretRef.current || {};
                      if (c.start != null && c.end != null) ta.setSelectionRange(c.start, c.end);
                    }
                  } catch {}
                }
                restoreScroll(y);
              });
            }}
            onFocus={() => setInputActive(true)}
            onBlur={(e) => {
              if (isIOS) return;
              try {
                const to = e.relatedTarget;
                if (to && to.getAttribute && to.getAttribute("data-finish-btn") === "1") return;
              } catch {}
              setInputActive(false);
            }}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full p-3 border rounded mb-24 outline-none focus:ring-2 focus:ring-black/10"
            onInput={() => {
              const y = lastYRef.current;
              requestAnimationFrame(() => {
                if (!isIOS) {
                  try {
                    const ta = textareaRef.current;
                    if (ta) {
                      ta.focus({ preventScroll: true });
                      const c = caretRef.current || {};
                      if (c.start != null && c.end != null) ta.setSelectionRange(c.start, c.end);
                    }
                  } catch {}
                }
                restoreScroll(y);
              });
            }}
            rows={4}
          />
        </div>
      </Shell>
    );
  }

  return null;
}
}
