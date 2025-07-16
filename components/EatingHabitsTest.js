import React, { useState } from "react";

function EatingHabitsTest({ onClose }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert("JEI PAMATAI ŠĮ ALERT – SUBMIT VEIKIA!");
    console.log("Atsakymai:", answers);
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/generate-eating-habits-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        setError("Serverio klaida: " + errText);
        setLoading(false);
        return;
      }

      const data = await resp.json();
      setDone(true);
      setLoading(false);
    setDone(true);
    } catch (e) {
      setError("Tinklo arba serverio klaida: " + (e.message || e));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Pavyzdinis klausimas */}
      <label>
        Kaip dažnai valgote pusryčius?
        <select
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, breakfast: e.target.value }))
          }
          required
        >
          <option value="">Pasirinkite</option>
          <option value="kiekvieną dieną">Kiekvieną dieną</option>
          <option value="kartais">Kartais</option>
          <option value="niekada">Niekada</option>
        </select>
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Siunčiama..." : "Siųsti testą"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {done && <p style={{ color: "green" }}>Ataskaita sugeneruota!</p>}
    </form>
  );
}

export default EatingHabitsTest;
