import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Workouts() {
  const { data: session, status } = useSession();
  const { t } = useTranslation("workouts");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

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
          <div className="mt-6 p-4 bg-gray-100 rounded text-left">
            <ReactMarkdown className="prose prose-sm max-w-none">{plan.text}</ReactMarkdown>
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
