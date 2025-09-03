import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { Info, CalendarDays } from "lucide-react";
import WorkoutPlayer from "./WorkoutPlayer";
import WorkoutViewer from "./WorkoutViewer";

// ⛳️ Minimalus jungiklis: jei nori pilno puslapio perkrovimo po generavimo – nustatyk į true
const HARD_RELOAD_ON_GENERATE_DONE = false;

/** Paprasta trijų taškų animacija: ., .., ... */
function DotsAnimation() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return <span>{dots}</span>;
}

/** YYYY/MM/DD formatas */
function formatYMD(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

// 🔍 Helper: patikrinam ar planas užbaigtas (palaikom kelis galimus laukų pavadinimus)
function isPlanCompleted(p) {
  // Konvertuojam įvairius formatus į boolean
  const truthy = (v) => {
    if (v === true) return true;
    if (v === false || v === 0) return false;
    if (v == null) return false;
    if (typeof v === "number") return v === 1 || v >= 100; // 100%
    if (v instanceof Date) return !isNaN(v.getTime());
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if ([
        "true","t","1","yes","y","done","completed","complete","finished",
        "atlikta","baigta","užbaigta","uzbaigta","ready","success"
      ].includes(s)) return true;
      if ([
        "false","f","0","no","n","not completed","neatlikta","nebaigta",
        "unfinished","pending","incomplete"
      ].includes(s)) return false;
      // jei tai panašu į datą – laikom kaip completed timestamp
      const ts = Date.parse(v);
      return !Number.isNaN(ts);
    }
    if (typeof v === "object") {
      // Kai kuriuose API status būna kaip { code: 'COMPLETED' }
      const code = (v?.code || v?.status || v?.value || "").toString().toLowerCase();
      if (["completed","complete","done","finished","success"].includes(code)) return true;
      if (["pending","incomplete","failed","open"].includes(code)) return false;
    }
    return !!v;
  };

  const candidates = [
    p?.wasCompleted,
    p?.wasCompleated, // dažna rašyba
    p?.completed,
    p?.isCompleted,
    p?.isDone,
    p?.status,
    p?.planStatus,
    p?.completionStatus,
    p?.progress?.status,
    p?.progress,
    p?.completedPercent,

    // Įdėti ir viduje esančius laukus – jei API grąžina giliai
    p?.planData?.wasCompleted,
    p?.planData?.wasCompleated,
    p?.planData?.completed,
    p?.planData?.completionStatus,
    p?.completedAt,
    p?.finishedAt,
    p?.planData?.completedAt,
  ];

  for (const v of candidates) {
    if (truthy(v)) return true;
  }
  return false;
}

export default function Workouts() {
  const { data: session, status } = useSession();
  const { t } = useTranslation("common");

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [parsedPlan, setParsedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showPlayer, setShowPlayer] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0, calories: 0 });

  // 👇 Naudosime, kad perduotume teisingą planId į WorkoutPlayer (feedback išsaugojimui)
  const [activePlanId, setActivePlanId] = useState(null);

  // 🔎 Minimalus sėkmės indikatorius + perėjimo sekimas
  const lastGenerateOkRef = useRef(false);
  const prevLoadingRef = useRef(false);

  // Parsinešam planų archyvą + statistiką (inic.)
  useEffect(() => {
    if (!session) return;

    // Planai
    fetch("/api/archive-plans")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data.plans) ? data.plans : [];
        const meEmail = session?.user?.email || null;
        const meId = session?.user?.id || null;
        const onlyMine = list.filter((p) => {
          const ownerEmail = p?.user?.email || p?.ownerEmail || p?.email || null;
          const ownerId = p?.userId || p?.user?.id || null;
          if (ownerEmail && meEmail) return ownerEmail === meEmail;
          if (ownerId && meId) return ownerId === meId;
          return false;
        });
        const sorted = onlyMine
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPlans(sorted);
        setSelectedPlan(sorted[0] || null); // naujausias – numatytasis
      })
      .catch(() => {
        setPlans([]);
        setSelectedPlan(null);
      });

    // Statistika
    fetch("/api/last-workout")
      .then((res) => res.json())
      .then((data) => setStats(data.stats || { totalWorkouts: 0, totalTime: 0, calories: 0 }))
      .catch(() => setStats({ totalWorkouts: 0, totalTime: 0, calories: 0 }));
  }, [session]);

  // 👇 Maža pagalbinė: „soft refresh“ planų po generavimo
  const refreshPlans = async () => {
    if (!session) return [];
    try {
      const res = await fetch("/api/archive-plans");
      const data = await res.json();
      const list = Array.isArray(data.plans) ? data.plans : [];
      const meEmail = session?.user?.email || null;
      const meId = session?.user?.id || null;
      const onlyMine = list.filter((p) => {
        const ownerEmail = p?.user?.email || p?.ownerEmail || p?.email || null;
        const ownerId = p?.userId || p?.user?.id || null;
        if (ownerEmail && meEmail) return ownerEmail === meEmail;
        if (ownerId && meId) return ownerId === meId;
        return false;
      });
      const sorted = onlyMine
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPlans(sorted);
      setSelectedPlan((prev) => prev || sorted[0] || null);
      return sorted;
    } catch {
      setPlans([]);
      setSelectedPlan(null);
      return [];
    }
  };

  // 🔔 REAKCIJA Į ANIMACIJOS PABAIGĄ: kai loading pereina iš true į false IR sėkmė → darom refresh
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    if (wasLoading && !loading) {
      if (lastGenerateOkRef.current) {
        if (HARD_RELOAD_ON_GENERATE_DONE) {
          try { window.location.reload(); } catch (_) {}
        } else {
          refreshPlans().then((list) => {
            if (Array.isArray(list) && list.length > 0) {
              setSelectedPlan(list[0]);
            }
          });
        }
      }
    }
    prevLoadingRef.current = loading;
  }, [loading, session]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    lastGenerateOkRef.current = false;
    try {
      const response = await fetch("/api/generate-workout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "generateFailed");

      // ✅ pažymime sėkmę – po animacijos pabaigos įvyks refresh (soft arba hard)
      lastGenerateOkRef.current = true;

      if (data?.plan?.id) {
        // įdedam naują planą į viršų ir pažymim kaip aktyvų (paliekam tavo logiką)
        const nextPlans = [data.plan, ...plans];
        const sorted = nextPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPlans(sorted);
        setSelectedPlan(sorted[0] || data.plan);
      }
    } catch (error) {
      lastGenerateOkRef.current = false;
      alert(t("generateFailed"));
    } finally {
      setLoading(false); // 👈 tai „išjungia“ animaciją; useEffect suveiks ir padarys refresh jei sėkmė
    }
  };

  const handleViewPlan = () => {
    if (!selectedPlan?.planData?.text) return;
    setShowViewer(true);
  };

  const handleStartWorkout = () => {
    if (!selectedPlan?.planData?.text) return;
    if (!parsedPlan) {
      setParsedPlan(parseWorkoutText(selectedPlan.planData.text || ""));
    }
    setActivePlanId(selectedPlan?.id || null); // 👈 perduosim į grotuvą
    setShowPlayer(true);
  };

  const handleCloseWorkout = () => {
    setShowPlayer(false);
    setParsedPlan(null);
    setActivePlanId(null);
  };

  if (status === "loading") return <div>{t("loading")}</div>;
  if (!session) return <div>{t("pleaseLogin")}</div>;

  const newestPlan = plans[0];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white shadow-xl rounded-2xl">
      <h1 className="text-3xl font-bold text-blue-900 text-center mb-2">
        {t("welcomeUser", { name: session.user.name || t("user") })}
      </h1>

      <p className="text-center text-gray-500 mb-4 flex items-center justify-center gap-1">
        <CalendarDays className="w-5 h-5" />
        {t("lastGenerated")}: {" "}
        {newestPlan?.createdAt ? formatYMD(newestPlan.createdAt) : t("noPlans")}
      </p>

      {/* Stat kortelės */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          value={stats?.totalWorkouts || 0}
          label={t("workouts")}
          tooltip={t("workoutsInfo")}
          color="bg-blue-50"
        />
        <StatCard
          value={`${stats?.totalTime || 0} min`}
          label={t("totalTime")}
          tooltip={t("totalTimeInfo")}
          color="bg-green-50"
        />
        <StatCard
          value={`${stats?.calories || 0} kcal`}
          label={t("caloriesBurned")}
          tooltip={t("caloriesInfo")}
          color="bg-yellow-50"
        />
      </div>

      {/* Valdikliai */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        <select
          className="border p-2 rounded shadow cursor-pointer w-full sm:w-auto"
          onChange={(e) =>
            setSelectedPlan(plans.find((p) => String(p.id) === e.target.value))
          }
          value={selectedPlan?.id != null ? String(selectedPlan.id) : ""}
          disabled={loading}
        >
          {plans.map((plan) => {
          const completed = isPlanCompleted(plan);
          const statusText = completed ? t("completed") : t("notCompleted");
          const dateText = plan.createdAt ? formatYMD(plan.createdAt) : t("noDate");
          return (
            <option key={String(plan.id)} value={String(plan.id)}>
              {dateText} — {statusText}
            </option>
          );
          })}
        </select>

        <button
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded shadow transition w-full sm:w-auto disabled:opacity-60"
          onClick={handleViewPlan}
          disabled={!selectedPlan?.planData?.text || loading}
        >
          {t("viewPlan")}
        </button>

        <button
          onClick={handleGeneratePlan}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow transition w-full sm:w-auto disabled:opacity-60 flex items-center justify-center gap-1"
          disabled={loading}
        >
          {loading ? (
            <>
              {t("generating")} <DotsAnimation />
            </>
          ) : (
            t("generatePlan")
          )}
        </button>
      </div>

      {/* Start mygtukas */}
      {selectedPlan?.planData?.text && (
        <div className="flex justify-center mb-6">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow disabled:opacity-60"
            onClick={handleStartWorkout}
            disabled={loading}
          >
            {t("startWorkout")}
          </button>
        </div>
      )}

      {/* Peržiūra */}
      {showViewer && selectedPlan?.planData?.text && (
        <WorkoutViewer
          planText={selectedPlan.planData.text}
          onClose={() => setShowViewer(false)}
        />
      )}

      {/* Grotuvas (su planId perdavimu, kad /api/complete-plan(s) turėtų ID) */}
      {showPlayer && parsedPlan && (
        <WorkoutPlayer
          workoutData={parsedPlan}
          planId={activePlanId}
          onClose={handleCloseWorkout}
        />
      )}
    </div>
  );
}

function StatCard({ value, label, tooltip, color }) {
  return (
    <div className={`${color} p-4 rounded-xl shadow relative group`}>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
      <InfoTooltip text={tooltip} />
    </div>
  );
}

function InfoTooltip({ text }) {
  return (
    <div className="absolute top-2 right-2">
      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer peer" />
      <div className="absolute hidden peer-hover:block bg-white border shadow-md rounded p-2 text-xs w-48 max-w-[calc(100vw-2rem)] left-1/2 -translate-x-1/2 top-6 z-20">
        {text}
      </div>
    </div>
  );
}
