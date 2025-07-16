import React, { useState } from "react";

function EatingHabitsTest() {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [responseText, setResponseText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Formos pateikimas prasidėjo");
    console.log("Atsakymai:", answers);
    setLoading(true);
    setError(null);
    setDone(false);
    setResponseText("");

    try {
      const resp = await fetch("/pages/api/generate-eating-habits-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      console.log("📡 HTTP statusas:", resp.status);
      const contentType = resp.headers.get("content-type");
      console.log("📦 Content-Type:", contentType);

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("❌ Serverio klaida:", errText);
        setError("Serverio klaida: " + errText);
        setLoading(false);
        return;
      }

      // Bandome gauti JSON
      let data;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        const fallbackText = await resp.text();
        console.warn("⚠️ Nepavyko parse'int JSON, bet turim tekstą:", fallbackText);
        setResponseText(fallbackText);
      }

      console.log("✅ Gauti duomenys:", data);
      setResponseText(JSON.stringify(data, null, 2));
      setDone(true);
    } catch (e) {
      console.error("🌐 Tinklo klaida:", e);
      setError("Tinklo arba serverio klaida: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow mt-10">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">
        Testavimui: EatingHabitsTest
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Kaip dažnai valgote pusryčius?
          <select
            className="block border rounded px-3 py-2 mt-1"
            onChange={(e) =>
              setAnswers((prev) => ({
                ...prev,
                breakfast: e.target.value,
              }))
            }
            required
          >
            <option value="">Pasirinkite</option>
            <option value="kiekvieną dieną">Kiekvieną dieną</option>
            <option value="kartais">Kartais</option>
            <option value="niekada">Niekada</option>
          </select>
        </label>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Siunčiama..." : "Siųsti testą"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {done && <p className="text-green-600 mt-4">✅ Ataskaita sugeneruota!</p>}
      {responseText && (
        <pre className="bg-gray-100 mt-4 p-4 rounded text-sm whitespace-pre-wrap">
          {responseText}
        </pre>
      )}
    </div>
  );
}

export default EatingHabitsTest;
