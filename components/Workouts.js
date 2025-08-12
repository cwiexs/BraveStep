import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState, useEffect, useRef } from "react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { Info, CalendarDays } from "lucide-react";
import WorkoutPlayer from "./WorkoutPlayer";
import WorkoutViewer from "./WorkoutViewer";
import { useRouter } from "next/router";

export default function Workouts() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslation("common");

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [parsedPlan, setParsedPlan] = useState(null);

  // --- Generavimo būsena + progresas ---
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef(null);

  const [showPlayer, setShowPlayer] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0, calories: 0 });

  // Parsinešam planų archyvą + statistiką
  useEffect(() => {
    if (session) {
      fetch("/api/archive-plans")
        .then(res => res.json())
        .then(data => setPlans(data.plans || []))
        .catch(() => setPlans([]));

      fetch("/api/last-workout")
        .then(res => res.json())
        .then(data => setStats(data.stats || { totalWorkouts: 0, totalTime: 0, calories: 0 }))
        .catch(() => setStats({ totalWorkouts: 0, totalTime: 0, calories: 0 }));
    }
  }, [session]);

  // Valdo dirbtinį progresą: kai loading=true – judinam juostą iki ~90%, tada paliekam kol API baigs
  useEffect(() => {
    if (loading) {
      setProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(() => {
        setProgress(prev => {
          // Greičiau iki 60%, tada lėčiau iki 90%
          const increment = prev < 60 ? 3 : prev < 85 ? 1.5 : prev < 90 ? 0.5 : 0;
          const next = Math.min(prev + increment, 90);
          return next;
        });
      }, 120);
    } else {
      // užbaigiam iki 100 ir išvalom
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setProgress(prev => (prev > 0 && prev < 100 ? 100 : prev));
      // po trumpučio mirktelėjimo paslepiam progresą
      const to = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(to);
    }
  }, [loading]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-workout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "generateFailed");

      // Gaunam pilną planą su id/createdAt/planData – iškart įdedam į sąrašą
      if (data?.plan?.id) {
        setPlans(prev => [data.plan, ...prev]);
        setSelectedPlan(data.plan);
      }

      // Jei vistiek norėtum „pilno“ atsinaujinimo:
      // await router.replace(router.asPath);
    } catch (error) {
      alert(t("generateFailed"));
    } finally {
      setLoading(false);
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
    setShowPlayer(true);
  };

  const handleCloseWorkout = () => {
    setShowPlayer(false);
    setParsedPlan(null);
  };

  if (status === "loading") return <div>{t("loading")}</div>;
  if (!session) return <div>{t("pleaseLogin")}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white shadow-xl rounded-2xl">
      <h1 className="text-3xl font-bold text-blue-900 text-center mb-2">
        {t("welcomeUser", { name: session.user.name || t("user") })}
      </h1>

      <p className="text-center text-gray-500 mb-4 flex items-center justify-center gap-1">
        <CalendarDays className="w-5 h-5" />
        {t("lastGenerated")}:{" "}
        {plans[0]?.createdAt
          ? new Date(plans[0].createdAt).toLocaleDateString()
          : t("noPlans")}
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
            setSelectedPlan(plans.find((p) => p.id === e.target.value))
          }
          value={selectedPlan?.id || ""}
          disabled={loading}
        >
          <option value="">{t("selectPlan")}</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.createdAt
                ? new Date(plan.createdAt).toLocaleDateString()
                : t("noDate")}
            </option>
          ))}
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
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow transition w-full sm:w-auto disabled:opacity-60"
          disabled={loading}
        >
          {loading ? t("generating") : t("generatePlan")}
        </button>
      </div>

      {/* Progreso juosta (mini) */}
      {loading && (
        <div className="mb-4">
          <ProgressBar value={Math.round(progress)} label={t("generating")} />
        </div>
      )}

      {/* Skeletinis placeholder’is planui (rodom, kai generuojam) */}
      {loading && (
        <div className="mb-6">
          <PlanSkeleton />
        </div>
      )}

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

      {/* Grotuvas */}
      {showPlayer && parsedPlan && (
        <WorkoutPlayer
          workoutData={parsedPlan}
          onClose={handleCloseWorkout}
          visible={showPlayer}
        />
      )}
    </div>
  );
}

/* --- Mažos pagalbinės dalys --- */

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

/** Progreso juosta su etikete */
function ProgressBar({ value, label }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-xs text-gray-500">{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-2 rounded-full transition-[width] duration-150 ease-linear bg-green-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/** „Skeletas“: neutralus plokštelės placeholder’is su shimmer efektu */
function PlanSkeleton() {
  return (
    <div className="border rounded-2xl p-4 shadow-sm">
      <div className="animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-11/12 bg-gray-200 rounded" />
          <div className="h-3 w-10/12 bg-gray-200 rounded" />
          <div className="h-3 w-9/12 bg-gray-200 rounded" />
          <div className="h-3 w-8/12 bg-gray-200 rounded" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-28 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
