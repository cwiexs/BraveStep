import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { Info, CalendarDays } from "lucide-react";
import WorkoutPlayer from "./WorkoutPlayer";
import WorkoutViewer from "./WorkoutViewer";

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

  useEffect(() => {
    if (session) {
      fetch("/api/archive-plans")
        .then(res => res.json())
        .then(data => setPlans(data.plans || []))
        .catch(() => setPlans([]));

      fetch("/api/last-workout")
        .then(res => res.json())
        .then(data => {
          setStats(data.stats || { totalWorkouts: 0, totalTime: 0, calories: 0 });
        })
        .catch(() => {
          setStats({ totalWorkouts: 0, totalTime: 0, calories: 0 });
        });
    }
  }, [session]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-workout", { method: "POST" });
      const data = await response.json();
      if (data.plan) {
        setPlans(prev => [data.plan, ...prev]);
        setSelectedPlan(data.plan);
      }
    } catch (error) {
      alert(t("generateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = () => {
    if (!selectedPlan?.planData) return;
    setShowViewer(true);
  };

  const handleStartWorkout = () => {
    if (!selectedPlan?.planData) return;
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
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-2xl">
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

      <div className="grid grid-cols-3 gap-4 mb-6">
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

      <div className="flex gap-2 justify-center mb-6">
        <select
          className="border p-2 rounded shadow cursor-pointer"
          onChange={(e) =>
            setSelectedPlan(plans.find((p) => p.id === e.target.value))
          }
          value={selectedPlan?.id || ""}
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
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 rounded shadow transition"
          onClick={handleViewPlan}
          disabled={!selectedPlan}
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

      {selectedPlan && (
        <div className="flex justify-center mb-6">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            onClick={handleStartWorkout}
          >
            {t("startWorkout")}
          </button>
        </div>
      )}

      {showViewer && selectedPlan && (
        <WorkoutViewer
          planText={selectedPlan.planData.text || ""}
          onClose={() => setShowViewer(false)}
        />
      )}

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
      <div className="absolute hidden peer-hover:block bg-white border shadow-md rounded p-2 text-xs w-48 right-0 top-5 z-20">
        {text}
      </div>
    </div>
  );
}
