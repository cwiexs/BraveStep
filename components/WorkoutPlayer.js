import { useEffect, useLayoutEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { SkipBack, SkipForward, Pause, Play, RotateCcw, Settings, Power, Info } from "lucide-react";
import { useTranslation } from "next-i18next";

export default function WorkoutPlayer({ workoutData, planId, onClose }) {
  const { t, i18n } = useTranslation("common");
  const router = (typeof window !== "undefined" ? useRouter() : null);
  const isIOS = typeof navigator !== "undefined" && /iP(hone|ad|od)/i.test(navigator.userAgent);

  // ---- iOS scroll lock while typing ----
  const pageYRef = useRef(0);
  const scheduledTimeoutsRef = useRef([]);
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
  const [getReadySeconds, setGetReadySeconds] = useState(10);
  const [getReadySecondsStr, setGetReadySecondsStr] = useState("10");
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
  const exercise = day?.exercises?.[currentExerciseIndex];
  const step = exercise?.steps?.[currentStepIndex];

  const isLastExerciseInDay = !!day && currentExerciseIndex === (day?.exercises?.length || 1) - 1;
  const isLastStepInExercise = !!exercise && currentStepIndex === (exercise?.steps?.length || 1) - 1;

  // nauji aiškūs indikatoriai pabaigai
  const isTerminal = isLastExerciseInDay && isLastStepInExercise;
  const isRestAfter = step?.type === "rest_after";

  // i18n labels
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
  function findFirstExerciseIndex(ex) {
    if (!ex || !Array.isArray(ex.steps)) return 0;
    for (let i = 0; i < ex.steps.length; i++) {
      if (ex.steps[i]?.type === "exercise") return i;
    }
    return 0;
  }

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

  function stopAllScheduled() {
    try { (scheduledTimeoutsRef.current || []).forEach((id) => clearTimeout(id)); } catch {}
    scheduledTimeoutsRef.current = [];
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
      const gr = localStorage.getItem("bs_getready_seconds");
      if (gr != null) { const n = parseInt(gr, 10); if (Number.isFinite(n)) setGetReadySeconds(Math.max(0, Math.min(120, n))); }
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
  }, [voiceEnabled]);

  useEffect(() => { try { localStorage.setItem("bs_getready_seconds", String(getReadySeconds)); } catch {} }, [getReadySeconds]);

  // After switching from get_ready to exercise, ensure timer initializes
  useEffect(() => {
    if (phase === "exercise") {
      // kick the timer setup effect by nudging step state if needed
      setTimeout(() => {
        try { setCurrentStepIndex((v) => v); } catch {}
      }, 0);
    }
  }, [phase]);

  // Ensure exercise timer starts when we enter exercise (after get_ready)
  useEffect(() => {
    if (phase !== "exercise") return;
    const d = getTimedSeconds(step);
    if (Number.isFinite(d) && d > 0) {
      startTimedStep(d);
    } else {
      setSecondsLeft(0);
      setWaitingForUser(step?.type === "exercise");
    }
  }, [phase, currentExerciseIndex, currentStepIndex, step]);

  useEffect(() => { setGetReadySecondsStr(String(getReadySeconds)); }, [getReadySeconds]);

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
      if (phase === "get_ready") { cancelRaf(); setStepFinished(true); try { const firstEx = day?.exercises?.[0]; if (firstEx) { const idx = findFirstExerciseIndex(firstEx); setCurrentExerciseIndex(0); setCurrentStepIndex(idx); } } catch {} setPhase("exercise"); return; }
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

  // --- TIMER SETUP / STEP SWITCH ---
  useEffect(() => {
    if (phase !== "exercise") return;
    cancelRaf();
    stopAllScheduled();
    deadlineRef.current = null;

    if (!step) {
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
  
  function commitGetReady() {
    const raw = (getReadySecondsStr ?? "").toString().trim();
    const v = parseInt(raw, 10);
    const clamped = Number.isFinite(v) ? Math.max(0, Math.min(120, v)) : getReadySeconds;
    if (clamped !== getReadySeconds) setGetReadySeconds(clamped);
    setGetReadySecondsStr(String(clamped));
  }
function handleManualContinue() {
    cancelRaf();
    stopAllScheduled();
    if (phase === "intro") {
      primeIOSAudio();
      // Preselect first exercise step
      try {
        const firstEx = day?.exercises?.[0];
        if (firstEx) {
          const idx = findFirstExerciseIndex(firstEx);
          setCurrentExerciseIndex(0);
          setCurrentStepIndex(idx);
        } else {
          setCurrentExerciseIndex(0);
          setCurrentStepIndex(0);
        }
      } catch {}
      setPhase("get_ready");
      const gr = Number(getReadySeconds) || 0;
      if (gr > 0) {
        startTimedStep(gr);
        try {
          const id = setTimeout(() => { try { setPhase("exercise"); } catch {} }, Math.max(0, gr * 1000 + 60));
          scheduledTimeoutsRef.current.push(id);
        } catch {}
      } else {
        setSecondsLeft(0);
        setWaitingForUser(false);
        setPhase("exercise");
      }
    } else if (phase === "exercise") {
      setStepFinished(true);
      handlePhaseComplete();
    } else if (phase === "summary") {
      onClose?.();
    }
  }

  function handlePhaseComplete() {
    if (phase === "get_ready") { try { const firstEx = day?.exercises?.[0]; if (firstEx) { const idx = findFirstExerciseIndex(firstEx); setCurrentExerciseIndex(0); setCurrentStepIndex(idx); } } catch {} setPhase("exercise"); return; }
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
        aria-label={t("common.settings", { defaultValue: "Nustatymai" })}
        title={t("common.settings", { defaultValue: "Nustatymai" })}
      >
        <Settings className="w-5 h-5" />
      </button>
      <button
        onClick={() => {
          if (!inputActive) setShowConfirmExit(true);
        }}
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
      <div
        ref={scrollRef}
        onScroll={(e) => {
          lastYRef.current = e.currentTarget.scrollTop;
        }}
        className="flex-1 overscroll-contain p-6 pt-8 ${isIOS && inputActive ? "overflow-hidden" : "overflow-auto"}"
        style={isIOS && inputActive ? { WebkitOverflowScrolling: "auto" } : { WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
      {footer ? <div className="border-t p-4 sticky bottom-0 bg-white">{footer}</div> : null}

      {/* Settings modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{t("common.settings", { defaultValue: "Nustatymai" })}</h3>

            {/* Get ready seconds */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t("common.getReadyTime", { defaultValue: i18n.language?.startsWith("lt") ? "Pasiruošimo laikas (sekundėmis)" : "Get ready (seconds)" })}</p>
                <p className="text-sm text-gray-500">{t("common.getReadyHint", { defaultValue: i18n.language?.startsWith("lt") ? "Atgalinis skaičiavimas prieš treniruotės pradžią." : "Countdown before workout starts." })}</p>
              </div>
              <input
                type="number"
                min="0"
                max="120"
                value={getReadySecondsStr}
                onChange={(e) => { setGetReadySecondsStr(e.target.value); }}
                onBlur={commitGetReady}
                onKeyDown={(e) => { if (e.key === 'Enter') commitGetReady(); }}
                className="w-24 h-9 border rounded px-2 text-sm text-right"
              />
            </div>

            {/* Vibracija */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t("player.vibration", { defaultValue: "Vibracija" })}</p>
                <p className="text-sm text-gray-500">{t("player.vibrationDesc", { defaultValue: "Vibruoti kaitaliojant pratimą / poilsį." })}</p>
              </div>
<input
                type="number"
                min="0"
                max="120"
                value={getReadySecondsStr}
                onChange={(e) => { setGetReadySecondsStr(e.target.value); }}
                onBlur={commitGetReady}
                onKeyDown={(e) => { if (e.key === 'Enter') commitGetReady(); }}
                className="w-20 h-9 border rounded px-2 text-sm text-right"
              />
            </div>

              <button
                onClick={() => setVibrationEnabled((v) => !v)}
                className="px-3 py-1 rounded-full text-sm font-semibold ${vibrationEnabled ? "bg-green-600 text-white" : "bg-gray-200"}"
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
                  onClick={() => setFxEnabled((v) => !v)}
                  className="px-3 py-1 rounded-full text-sm font-semibold ${fxEnabled ? "bg-green-600 text-white" : "bg-gray-200"}"
                >
                  {fxEnabled ? t("common.on", { defaultValue: "Įjungta" }) : t("common.off", { defaultValue: "Išjungta" })}
                </button>
              </div>
              <div className="mt-2">
                <label className="text-sm mr-2">{t("player.fxTrack", { defaultValue: "Takelis:" })}</label>
                <select value={fxTrack} onChange={(e) => setFxTrack(e.target.value)} className="border rounded px-2 py-1 text-sm">
                  <option value="beep">beep.wav</option>
                  <option value="silence">silance.mp3</option>
                </select>
                <button onClick={() => { ping(); }} className="ml-3 px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                  {t("player.testFx", { defaultValue: "Išbandyti" })}
                </button>
              </div>
            </div>

            {/* Balso skaičiavimas (5..1) */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t("player.voice", { defaultValue: "Balso skaičiavimas" })}</p>
                <p className="text-sm text-gray-500">
                  {t("player.voiceDescShort", { defaultValue: "Skaičiuoti 5,4,3,2,1 paskutinėmis sekundėmis." })}
                </p>
              </div>
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                className="px-3 py-1 rounded-full text-sm font-semibold ${voiceEnabled ? "bg-green-600 text-white" : "bg-gray-200"}"
              >
                {voiceEnabled ? t("common.on", { defaultValue: "Įjungta" }) : t("common.off", { defaultValue: "Išjungta" })}
              </button>
            </div>
                        {/* Descriptions toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t("player.descriptions", { defaultValue: "Pratimų aprašymai" })}</p>
                <p className="text-sm text-gray-500">{t("player.descriptionsDescShort", { defaultValue: "Rodyti aprašymą po pavadinimu." })}</p>
              </div>
              <button
                onClick={() => setDescriptionsEnabled(v => !v)}
                className="px-3 py-1 rounded-full text-sm font-semibold ${descriptionsEnabled ? "bg-green-600 text-white" : "bg-gray-200"}"
              >
                {descriptionsEnabled ? t("common.on", { defaultValue: "Įjungta" }) : t("common.off", { defaultValue: "Išjungta" })}
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => { primeIOSAudio(); }} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">
                {t("player.primeAudio", { defaultValue: "Paruošti garsą" })}
              </button>
              <button onClick={() => { commitGetReady(); setShowSettings(false); }} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                {t("common.close", { defaultValue: "Uždaryti" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Exit modal */}
      {showConfirmExit && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-3">
              {t("player.confirmExitTitle", { defaultValue: "Išeiti iš treniruotės?" })}
            </h3>
            <p className="text-sm text-gray-700 mb-5">
              {t("player.confirmExitBody", {
                defaultValue: "Jei išeisite dabar, ši sesija nebus užskaityta kaip atlikta."
              })}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfirmExit(false)}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                {t("common.cancel", { defaultValue: "Atšaukti" })}
              </button>
              <button
                onClick={() => {
                  try { cancelRaf(); stopAllScheduled(); } catch {}
                  setShowConfirmExit(false);
                  onClose?.();
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {t("player.confirmExitCta", { defaultValue: "Išeiti" })}
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
  if (phase === "get_ready") {
    const firstEx = day?.exercises?.[0] || null;
    let firstSt = null;
    let totalSets = 0;
    if (firstEx?.steps && Array.isArray(firstEx.steps)) {
      totalSets = firstEx.steps.filter((s) => s.type === "exercise").length || 0;
      firstSt = firstEx.steps.find((s) => s.type === "exercise") || null;
    }
    const secShort = t("player.secShort", { defaultValue: i18n.language?.startsWith("lt") ? "sek" : "sec" });
    const upNextLabel = t("player.upNext", { defaultValue: "Kitas:" });

    function restartGetReady() { const gr = Number(getReadySeconds) || 0; stopAllScheduled(); startTimedStep(gr > 0 ? gr : 0); if (gr > 0) { try { const id = setTimeout(() => { try { setPhase("exercise"); } catch {} }, Math.max(0, gr * 1000 + 60)); scheduledTimeoutsRef.current.push(id); } catch {} } }

    return (
      <Shell
        footer={
          <>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => { cancelRaf(); stopAllScheduled(); setPhase("intro"); }} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={prevLabel}>
                <SkipBack className="w-6 h-6 text-gray-800" />
              </button>
              <button onClick={() => (paused ? resumeTimer() : pauseTimer())} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={pausePlayLabel}>
                {paused ? <Play className="w-6 h-6 text-gray-800" /> : <Pause className="w-6 h-6 text-gray-800" />}
              </button>
              <button onClick={restartGetReady} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={restartStepLabel}>
                <RotateCcw className="w-6 h-6 text-gray-800" />
              </button>
              <button onClick={() => { setStepFinished(true); try { const firstEx = day?.exercises?.[0]; if (firstEx) { const idx = findFirstExerciseIndex(firstEx); setCurrentExerciseIndex(0); setCurrentStepIndex(idx); } } catch {} setPhase("exercise"); }} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 shadow-sm" aria-label={nextLabel}>
                <SkipForward className="w-6 h-6 text-gray-800" />
              </button>
            </div>
          </>
        }
      >
        <div className="max-w-2xl mx-auto text-center mt-6">
          {/* GET_READY_HEADING */}
          <h2 className="text-2xl font-extrabold mb-2 text-yellow-500">
            {t("common.getReadyTitle", { defaultValue: i18n.language?.startsWith("lt") ? "Pasiruoškite treniruotei" : "Get ready" })}
          </h2>
          <p className="text-6xl font-extrabold text-yellow-500 mt-6">
            {secondsLeft > 0 ? `${secondsLeft} ${secShort}` : `0 ${secShort}"}
          </p>
          {paused && <p className="text-red-600 font-semibold mt-2">{pausedLabel}</p>}
          {firstEx && (
            <div className="mt-6 text-left inline-block text-start">
              <p className="text-sm font-semibold text-gray-700 mb-1">{upNextLabel}</p>
              <p className="text-base font-bold text-gray-900">{firstEx.title || firstEx.name || t("player.exercise", { defaultValue: "Exercise" })}</p>
              {firstSt && (
                <>
                  {(() => {
                    const repsText = getRepsText(firstSt);
                    if (repsText) return <p className="text-sm text-gray-900 mt-1">{repsText}</p>;
                    const secs = getTimedSeconds(firstSt);
                    const timedText = secs > 0 ? `${secs} ${secShort}` : "";
                    return timedText ? <p className="text-sm text-gray-900 mt-1">{timedText}</p> : null;
                  })()}
                  {firstSt.set != null && totalSets > 0 && (
                    <p className="text-sm text-gray-800 mt-1">{setWord} 1/{totalSets}</p>
                  )}
                  {firstEx.description && (
                    <p className="text-sm text-gray-700 italic mt-2">{firstEx.description}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Shell>
    );
  }

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
          <h2 className="text-2xl font-extrabold mb-2 ${isRestPhase ? restLabelClass : "text-gray-900"}">
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
              {secondsLeft > 0 ? `${secondsLeft} ${secShort}` : `0 ${secShort}"}
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
      { value: 5, label: "😄", text: t("player.rateTooEasy", { defaultValue: "Per lengva" }) },
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
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold ${submitting ? "opacity-70 cursor-wait" : "hover:bg-green-700"}"
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
                className="text-3xl p-1 rounded-full border-2 ${ 
                  rating === opt.value ? "border-green-600 bg-green-50" : "border-transparent"
                } hover:border-green-400"
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
              <span key={opt.value} className="text-xs ${rating === opt.value ? "font-bold text-green-700" : "text-gray-400"}">
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