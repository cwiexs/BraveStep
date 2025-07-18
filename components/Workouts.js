// Updated rendering component for styled workout plan with tooltips
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import { parseWorkoutText } from "./utils/parseWorkoutText";
import { Info } from "lucide-react";

export default function Workouts() {
  const { data: session, status } = useSession();
  const { t } = useTranslation("workouts");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  function shouldShowRest(text) {
    if (!text) return false;
    const cleaned = text.trim().toLowerCase();
    const noRestVariants = ["jokio poilsio", "no rest", "nowrest"];
    return !noRestVariants.includes(cleaned);
  }

  useEffect(() => {
    if (session) {
      fetch("/api/last-workout")
        .then(res => res.json())
        .then(data => setPlan(data.plan))
        .catch(() => setPlan(null));
    }
  }, [session]);

  async function handleGeneratePlan() {
    setLoading(true);
    setPlan(null);
    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setPlan(data.plan);
    } catch (error) {
      alert("Nepavyko sugeneruoti plano");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <div>{t("loading") || "Kraunasi..."}</div>;
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">{t("title") || "Workouts"}</h1>
        <p className="mb-4 text-lg">{t("welcomeGuest") || "Norėdami gauti personalizuotus workout'us, prisijunkite arba užsiregistruokite!"}</p>
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition">{t("signInToGenerate") || "Prisijunkite, kad generuotumėte workout'ą"}</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-blue-900 text-center">{t("title") || "Workouts"}</h1>
      <p className="mb-4 text-lg text-center">{t("welcomeLoggedIn") || "Galite generuoti naujus workout'us ar peržiūrėti ankstesnius."}</p>
      <div className="text-center">
        <button
          onClick={handleGeneratePlan}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
          disabled={loading}
        >
          {loading ? "Generuojama..." : t("generateWorkout") || "Generuoti naują treniruotę"}
        </button>
      </div>

      {plan && (
        <div className="mt-10 space-y-10">
          {(() => {
            const parsed = parseWorkoutText(plan.text);

            return (
              <div>
                <p className="text-md text-gray-800 whitespace-pre-wrap mb-6 bg-blue-50 p-4 rounded-xl">{parsed.introduction}</p>

                {parsed.days.map(day => (
                  <div key={day.day} className="bg-gray-50 border border-gray-300 rounded-xl p-6 shadow-sm">
                    <h2 className="text-2xl font-semibold text-blue-900 mb-2">Diena {day.day}</h2>
                    <p className="text-green-700 italic mb-3">💬 {day.motivationStart}</p>
                    <div className="space-y-4">
                      {day.exercises.map((ex, i) => (
                        <div key={i} className="bg-white border border-gray-200 p-4 rounded-lg relative">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-800">{ex.name ? ex.name : `Pratimas ${i + 1}`}</p>
                              <p className="text-sm text-gray-700">{ex.reps}, {ex.sets}</p>
                              {shouldShowRest(ex.restBetweenSets) && (
                                <p className="text-sm text-gray-600">{ex.restBetweenSets}</p>
                              )}
                              {shouldShowRest(ex.restAfterExercise) && (
                                <p className="text-sm text-gray-600">{ex.restAfterExercise}</p>
                              )}
                            </div>
                            <div className="relative group cursor-pointer">
                              <Info className="w-5 h-5 text-blue-500 mt-1" />
                              <div className="absolute hidden group-hover:block bg-white border border-gray-300 p-3 text-sm text-gray-700 rounded-lg shadow-md w-64 right-0 z-10">
                                {ex.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-blue-700 italic mt-4">🏁 {day.motivationEnd}</p>
                    {day.waterRecommendation && (
                      <p className="text-blue-600 mt-2">💧 {day.waterRecommendation}</p>
                    )}
                    {day.outdoorSuggestion && (
                      <p className="text-green-600 mt-1">🌿 {day.outdoorSuggestion}</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
