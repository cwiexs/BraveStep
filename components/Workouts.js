import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { Info, CalendarDays } from "lucide-react";
import WorkoutPlayer from "./WorkoutPlayer";
import WorkoutViewer from "./WorkoutViewer";
import { useRouter } from "next/router";

/** Paprasta trijų taškų animacija: ., .., ... */
function DotsAnimation() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + "." : ""));
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

export default function Workouts() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslation("common");

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [parsedPlan, setParsedPlan] = useState(null);
  const [loading, setLoading] = useState(false); // rodom tik taškelius mygtuke

  const [showPlayer, setShowPlayer] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0, calories: 0 });

  // Parsinešam planų archyvą + statistiką
  useEffect(() => {
    if (!session) return;

    fetch("/api/archive-plans")
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data.plans) ? data.plans : [];
        // Rikiuojam pagal createdAt (naujausias viršuje)
        const sorted = list
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPlans(sorted);
        // Numatytoji – naujausias planas (jei yra)
        setSelectedPlan(sorted[0] || null);
      })
      .catch(() => {
        setPlans([]);
        setSelectedPlan(null);
      });

    fetch("/api/last-workout")
      .then(res => res.json())
      .then(data => setStats(data.stats || { totalWorkouts: 0, totalTime: 0, calories: 0 }))
      .catch(() => setStats({ totalWorkouts: 0, totalTime: 0, calories: 0 }));
  }, [session]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate-workout", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "generateFailed");

      if (data?.plan?.id) {
        // Įdedam naują planą į viršų ir pasirenkam jį kaip aktyvų
        const nextPlans = [data.plan, ...plans];
        // (saugumo sumetimais – vėl išrikiuojam pagal datą)
        const sorted = nextPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPlans(sorted);
        setSelectedPlan(sorted[0] || data.plan);
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

  // Paskutinės generacijos data viršuje – ima patį naujausią planą
  const newestPlan = plans[0];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white shadow-xl rounded-2xl">
      <h1 className="text-3xl font-bold text-blue-900 text-center mb-2">
        {t("welcomeUser", { name: session.user.name || t("user") })}
      </h1>

      <p className="text-center text-gray-500 mb-4 flex items-center justify-center gap-1">
        <CalendarDays className="w-5 h-5" />
        {t("lastGenerated")}:{" "}
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
          onChange={(e) => setSelectedPlan(plans.find((p) => p.id === e.target.value))}
          value={selectedPlan?.id || ""}
          disabled={loading}
        >
          {/* Nebereikia „SelectPlan“, nes automatiškai parenkam naujausią */}
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.createdAt ? formatYMD(plan.createdAt) : t("noDate")}
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
