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

// 🔍 Helper: paprastas ir tikslus pagal DB schemą
// Prisma: model GeneratedPlan { wasCompleted Boolean @default(false) }
function isPlanCompleted(p) {
  return p?.wasCompleted === true;
}

export default function Workouts() {
  const { data: session, status } = useSession();
  const { t: tr } = useTranslation("common");

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [parsedPlan, setParsedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pre-generation modal
  const [showPreGen, setShowPreGen] = useState(false);
  const [preGenNotes, setPreGenNotes] = useState("");

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

  const handleGeneratePlan = async (notes = "") => {
    setLoading(true);
    lastGenerateOkRef.current = false;
    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userNotes: notes })
      });
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
      alert(tr("generateFailed"));
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

  if (status === "loading") return <div>{tr("loading")}</div>;
  if (!session) return <div>{tr("pleaseLogin")}</div>;

  const newestPlan = plans[0];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white shadow-xl rounded-2xl">
      <h1 className="text-3xl font-bold text-blue-900 text-center mb-2">
        {tr("welcomeUser", { name: session.user.name || tr("user") })}
      </h1>

      <p className="text-center text-gray-500 mb-4 flex items-center justify-center gap-1">
        <CalendarDays className="w-5 h-5" />
        {tr("lastGenerated")}: {" "}
        {newestPlan?.createdAt ? formatYMD(newestPlan.createdAt) : tr("noPlans")}
      </p>

      {/* Stat kortelės */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          value={stats?.totalWorkouts || 0}
          label={tr("workouts")}
          tooltip={tr("workoutsInfo")}
          color="bg-blue-50"
        />
        <StatCard
          value={`${stats?.totalTime || 0} min`}
          label={tr("totalTime")}
          tooltip={tr("totalTimeInfo")}
          color="bg-green-50"
        />
        <StatCard
          value={`${stats?.calories || 0} kcal`}
          label={tr("caloriesBurned")}
          tooltip={tr("caloriesInfo")}
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
          const statusText = completed ? tr("completed") : tr("notCompleted");
          const dateText = plan.createdAt ? formatYMD(plan.createdAt) : tr("noDate");
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
          {tr("viewPlan")}
        </button>

        <button
          onClick={() => setShowPreGen(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow transition w-full sm:w-auto disabled:opacity-60 flex items-center justify-center gap-1"
          disabled={loading}
        >
          {loading ? (
            <>
              {tr("generating")} <DotsAnimation />
            </>
          ) : (
            tr("generatePlan")
          )}
        </button>
      </div>

      {/* Pre-generation modal */}
{showPreGen && (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
      <h3 className="text-xl font-semibold mb-2">{tr("preGen.title", { defaultValue: "Prieš kuriant planą" })}</h3>
      <p className="text-sm text-gray-600 mb-3">{tr("preGen.intro", { defaultValue: "Individualus planas bus kuriamas pagal jūsų paskyros duomenis, tikslus ir įpročius." })}</p>
      <div className="bg-amber-50 text-amber-900 text-sm rounded-lg p-3 mb-4">{tr("preGen.disclaimer", { defaultValue: "Jei turite diskomfortą, skausmą ar kitų svarbių pastabų — įrašykite žemiau, kad planas būtų pritaikytas saugiau." })}</div>
      <label className="block text-sm font-medium mb-1" htmlFor="pre-gen-notes">{tr("preGen.notesLabel", { defaultValue: "Papildoma informacija (nebūtina)" })}</label>
      <textarea id="pre-gen-notes" value={preGenNotes} onChange={e=>setPreGenNotes(e.target.value)} className="w-full h-28 border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={tr("preGen.placeholder", { defaultValue: "Pvz., šiandien jaučiu nugaros skausmą; venkite šuoliukų; prioritetas — laikysena ir mobilumas." })} />
      <div className="flex justify-end gap-2">
        <button onClick={()=>setShowPreGen(false)} className="px-4 py-2 rounded-lg border">{tr("preGen.cancel", { defaultValue: "Atšaukti" })}</button>
        <button onClick={async ()=>{ setShowPreGen(false); await handleGeneratePlan(preGenNotes); setPreGenNotes(""); }} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-60" disabled={loading}>
          {loading ? tr("generating") : tr("preGen.generateNow", { defaultValue: "Kurti planą" })}
        </button>
      </div>
    </div>
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
            {tr("startWorkout")}
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
