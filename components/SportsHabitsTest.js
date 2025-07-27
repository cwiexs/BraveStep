import React, { useState } from "react";
import { useTranslation } from "next-i18next";

const questions = [
  { key: "endurance_vs_strength", category: "type" },
  { key: "cardio_preference", category: "type" },
  { key: "heavy_weights", category: "strength" },
  { key: "light_weights_high_reps", category: "endurance" },
  { key: "long_distance_running", category: "endurance" },
  { key: "sprint_training", category: "strength" },
  { key: "yoga_preference", category: "flexibility" },
  { key: "team_sports_interest", category: "psychology" },
  { key: "individual_sports_preference", category: "psychology" },
  { key: "motivation_from_challenges", category: "psychology" },
  { key: "focus_on_upper_body", category: "muscle_balance" },
  { key: "focus_on_lower_body", category: "muscle_balance" },
  { key: "core_strength_priority", category: "muscle_balance" },
  { key: "enjoys_outdoor_activities", category: "preferences" },
  { key: "gym_training_preference", category: "preferences" },
  { key: "home_training_preference", category: "preferences" },
  { key: "exercise_variety", category: "preferences" },
  { key: "exercise_consistency", category: "habits" },
  { key: "workout_duration_preference", category: "habits" },
  { key: "high_intensity_training", category: "habits" },
];

const categoryColors = {
  type: "bg-blue-100 text-blue-700",
  strength: "bg-red-100 text-red-700",
  endurance: "bg-green-100 text-green-700",
  flexibility: "bg-purple-100 text-purple-700",
  psychology: "bg-yellow-100 text-yellow-700",
  muscle_balance: "bg-indigo-100 text-indigo-700",
  preferences: "bg-pink-100 text-pink-700",
  habits: "bg-gray-100 text-gray-700",
};

export default function SportsHabitsTest({ onClose }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const filled = Object.keys(answers).length;
  const total = questions.length;
  const percent = Math.round((filled / total) * 100);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/generate-sports-habits-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          preferredLanguage: "en",
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        setError("Serverio klaida: " + errText);
        return;
      }
      setSuccessMessage(t("test.successMessage"));
    } catch (e) {
      setError("Tinklo klaida: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-3 text-blue-800">{t("test.sportIntroTitle")}</h3>
      <p className="mb-6 text-gray-700">{t("test.sportIntroText")}</p>

      <div className="w-full h-4 bg-gray-200 rounded mb-8">
        <div
          className="h-4 bg-blue-500 rounded transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.key} className="bg-white border rounded-xl shadow-md p-5 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg text-blue-900">{idx + 1} / {total}</span>
              <span className={`px-3 py-1 rounded-full font-semibold text-sm shadow-sm ${categoryColors[q.category]}`}>
                {t(`test.cat_${q.category}`)}
              </span>
            </div>
            <span className="mb-2 font-medium text-gray-800">{t(`test.q_${q.key}`)}</span>
            <div className="flex flex-row gap-3 mt-2 justify-center">
              {[1, 2, 3, 4, 5].map(opt => (
                <label key={opt} className="flex flex-col items-center cursor-pointer group" title={opt}>
                  <input
                    type="radio"
                    name={q.key}
                    value={opt}
                    checked={answers[q.key] === opt}
                    onChange={() => handleAnswer(q.key, opt)}
                    className="sr-only"
                    required
                    disabled={loading || successMessage}
                  />
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 text-lg font-semibold
                      ${answers[q.key] === opt
                        ? "bg-blue-500 text-white border-blue-700 scale-110"
                        : "bg-gray-100 text-blue-900 border-blue-300 group-hover:border-blue-500"
                      } transition-all duration-150`}
                  >
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-10">
        {!successMessage && (
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={filled < total || loading}
            className="bg-blue-700 text-white rounded px-10 py-3 font-bold shadow-lg transition hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? t("test.generating") : t("test.submit")}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 text-red-700 bg-red-100 border border-red-300 rounded-lg p-4 text-center font-semibold text-lg">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mt-6 text-green-700 bg-green-100 border border-green-300 rounded-lg p-4 text-center font-semibold text-lg">
          {successMessage}
        </div>
      )}
    </div>
  );
}
