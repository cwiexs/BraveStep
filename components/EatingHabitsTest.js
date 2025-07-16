import { useSession } from "next-auth/react";
import { useState } from "react";

export default function EatingHabitsTest() {
  const { data: session, status } = useSession();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const exampleAnswers = {
    breakfastRegularity: 3,
    waterIntake: 4,
    lateNightEating: 2,
    snackingFrequency: 5,
    balancedMeals: 3,
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/generate-eating-habits-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: exampleAnswers,
          preferredLanguage: "lt",
        }),
      });

      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      alert("Nepavyko gauti analizės");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <div>Kraunasi...</div>;

  if (!session) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">Mitybos testas</h1>
        <p className="mb-4 text-lg">
          Norėdami gauti analizę, prisijunkite arba užsiregistruokite!
        </p>
        <button className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow">
          Prisijungti
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-blue-900 text-center">Mitybos testas</h1>
      <p className="mb-4 text-lg text-center">
        Spauskite, kad gautumėte personalizuotą analizę pagal savo atsakymus.
      </p>
      <div className="text-center">
        <button
          onClick={handleGenerateReport}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
          disabled={loading}
        >
          {loading ? "Generuojama..." : "Generuoti analizę"}
        </button>
      </div>

      {report && (
        <div className="mt-10 bg-gray-50 border border-gray-300 rounded-xl p-6 shadow-sm whitespace-pre-wrap">
          {report}
        </div>
      )}
    </div>
  );
}
