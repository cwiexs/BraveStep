
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { Info, CalendarDays, ChevronDown } from "lucide-react";
import WorkoutPlayer from "./WorkoutPlayer";

export default function Workouts() {
  const { data: session, status } = useSession();
  const { t } = useTranslation("common");
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [parsedPlan, setParsedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0, calories: 0 });

  useEffect(() => {
    if (session) {
      fetch("/api/archive-plans")
        .then(res => res.json())
        .then(data => setPlans(data.plans))
        .catch(() => setPlans([]));

      fetch("/api/last-workout")
        .then(res => res.json())
        .then(data => {
          setStats(data.stats);
        });
    }
  }, [session]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-workout", { method: "POST" });
      const data = await response.json();
      setPlans(prev => [data.plan, ...prev]);
    } catch (error) {
      alert(t("generateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = () => {
    if (!selectedPlan) return;
    setParsedPlan(parseWorkoutText(selectedPlan.text));
  };

  if (status === "loading") return <div>{t("loading")}</div>;
  if (!session) return <div>{t("pleaseLogin")}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-2xl">
      <h1 className="text-3xl font-bold text-blue-900 text-center mb-2">{t("welcomeUser", { name: session.user.name || t("user") })}</h1>
      <p className="text-center text-gray-500 mb-4 flex items-center justify-center gap-1">
        <CalendarDays className="w-5 h-5" />{t("lastGenerated")}: {plans[0]?.date?.slice(0,10) || t("noPlans")}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl shadow relative group">
          <p className="text-lg font-semibold">{stats.totalWorkouts}</p>
          <p className="text-sm text-gray-600">{t("workouts")}</p>
          <InfoTooltip text={t("workoutsInfo")} />
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow relative group">
          <p className="text-lg font-semibold">{stats.totalTime} min</p>
          <p className="text-sm text-gray-600">{t("totalTime")}</p>
          <InfoTooltip text={t("totalTimeInfo")} />
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow relative group">
          <p className="text-lg font-semibold">{stats.calories} kcal</p>
          <p className="text-sm text-gray-600">{t("caloriesBurned")}</p>
          <InfoTooltip text={t("caloriesInfo")} />
        </div>
      </div>

      <div className="flex gap-2 justify-center mb-6">
        <select
          className="border p-2 rounded shadow cursor-pointer"
          onChange={(e) => setSelectedPlan(plans.find(p => p.id === e.target.value))}
        >
          <option>{t("selectPlan")}</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {new Date(plan.date).toLocaleDateString()}
            </option>
          ))}
        </select>
        <button
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 rounded shadow transition"
          onClick={handleViewPlan}
        >
          {t("viewPlan")}
        </button>
        <button
          onClick={handleGeneratePlan}
          className="bg-green-500 hover:bg-green-600 text-white px-4 rounded shadow transition"
          disabled={loading}
        >
          {loading ? t("generating") : t("generatePlan")}
        </button>
      </div>

      {parsedPlan && (
        <>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            onClick={() => setShowPlayer(true)}
          >
            {t("startWorkout")}
          </button>
          <WorkoutPlayer workoutData={parsedPlan} onClose={() => setShowPlayer(false)} visible={showPlayer} />
        </>
      )}
    </div>
  );
}

function InfoTooltip({ text }) {
  return (
    <div className="absolute top-2 right-2">
      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer peer" />
      <div className="absolute hidden peer-hover:block bg-white border shadow-md rounded p-2 text-xs w-48 right-0 top-5 z-20">
        {text}
      </div>
    </div>
  );
}
