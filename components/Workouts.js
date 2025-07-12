import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import parseWorkoutText from "./utils/parseWorkoutText";

export default function Workouts() {
  const { data: session, status } = useSession();
  const { t } = useTranslation("workouts");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

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

  if (session) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">{t("title") || "Workouts"}</h1>
        <p className="mb-4 text-lg">{t("welcomeLoggedIn") || "Sveikiname prisijungus! Galite generuoti naujus workout'us, peržiūrėti ankstesnius, pasirinkti el. pašto pranešimus ir t.t."}</p>
        <button
          onClick={handleGeneratePlan}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
          disabled={loading}
        >
          {loading ? "Generuojama..." : t("generateWorkout") || "Generuoti naują treniruotę"}
        </button>
        {plan && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-left space-y-6">
            {(() => {
              const parsed = parseWorkoutText(plan.text);

              return (
                <>
                  {parsed.introduction && <p className="text-sm text-gray-700 whitespace-pre-wrap">{parsed.introduction}</p>}

                  {parsed.days.map((day, idx) => (
                    <div key={idx} className="border p-4 rounded bg-white shadow">
                      <h2 className="text-xl font-bold mb-2">{day.title}</h2>
                      <p className="italic text-green-700">💬 {day.motivationStart}</p>
                      <ul className="mt-4 space-y-2">
                        {day.exercises.map((ex, i) => (
                          <li key={i} className="bg-gray-50 p-3 rounded border">
                            <strong>{ex.name}</strong><br />
                            {ex.reps}<br />
                            {ex.sets}<br />
                            {ex.restBetweenSets}<br />
                            {ex.restAfterExercise}<br />
                            <em className="text-sm text-gray-600">{ex.description}</em>
                          </li>
                        ))}
                      </ul>
                      <p className="italic text-blue-700 mt-4">🏁 {day.motivationEnd}</p>
                    </div>
                  ))}

                  {parsed.missingFields && (
                    <div className="mt-6 text-red-700 bg-red-50 p-4 rounded">
                      <h3 className="font-semibold">Trūkstami duomenys:</h3>
                      <pre className="whitespace-pre-wrap text-sm">{parsed.missingFields}</pre>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg text-center">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">{t("title") || "Workouts"}</h1>
      <p className="mb-4 text-lg">{t("welcomeGuest") || "Norėdami gauti personalizuotus workout'us, prisijunkite arba užsiregistruokite! Visi workout'ai generuojami dirbtinio intelekto pagalba."}</p>
      <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition">{t("signInToGenerate") || "Prisijunkite, kad generuotumėte workout'ą"}</button>
    </div>
  );
}
