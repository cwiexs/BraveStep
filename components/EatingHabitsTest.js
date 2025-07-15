import React, { useState } from "react";
import { useTranslation } from "next-i18next";

// Visi klausimų raktai ir jų kategorijos
const questions = [
  // I. Valgymo planavimas ir reguliarumas
  { key: "plan_meals", category: "planning" },
  { key: "eat_regularly", category: "planning" },
  { key: "late_eating", category: "planning" },
  { key: "overeating", category: "planning" },

  // II. Sveikų pasirinkimų darymas
  { key: "eat_vegetables", category: "choices" },
  { key: "eat_fruits", category: "choices" },
  { key: "cook_from_scratch", category: "choices" },
  { key: "try_healthy_recipes", category: "choices" },
  { key: "read_labels", category: "choices" },
  { key: "eat_fast", category: "choices" },
  { key: "drink_water", category: "choices" },
  { key: "choose_eco", category: "choices" },

  // III. Emocinis ir socialinis valgymas
  { key: "emotional_eating", category: "emotional" },
  { key: "mood_affects_eating", category: "emotional" },
  { key: "social_overeat", category: "emotional" },
  { key: "restrict_binge", category: "emotional" },
  { key: "feel_guilt", category: "emotional" },

  // IV. Nesveiki įpročiai
  { key: "eat_fast_food", category: "unhealthy" },
  { key: "drink_sugary", category: "unhealthy" },
  { key: "eat_with_screens", category: "unhealthy" },
  { key: "eat_outside", category: "unhealthy" },

  // V. Maisto suvokimas ir nuostatos
  { key: "think_fast_food_ok", category: "attitude" },
  { key: "taste_over_nutrition", category: "attitude" },
  { key: "think_healthy_hard", category: "attitude" },
  { key: "mindless_eating", category: "attitude" },
  { key: "think_balanced", category: "attitude" },

  // VI. Papildomi klausimai apie gyvenimo būdą
  { key: "take_supplements", category: "supplements" },
];

function EatingHabitsTest({ onClose }) {
  const { t, i18n } = useTranslation();
  const [answers, setAnswers] = useState({});

  // Parinkčių generavimas (5 burbuliukai)
  const options = [1, 2, 3, 4, 5];

  // Skaičiuoti kiek atsakymų užpildyta
  const filled = Object.keys(answers).length;

  // Galima papildyti rezultatų analize
  const handleSubmit = e => {
    e.preventDefault();
    alert(t("test.thank_you")); // Arba perduoti rezultatą aukštesniam komponentui
    onClose();
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-3">{t("test.introTitle")}</h3>
      <p className="mb-4 text-gray-700">{t("test.introText")}</p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Klausimai pagal kategorijas */}
          {[
            { label: t("test.cat_planning"), q: questions.filter(q => q.category === "planning") },
            { label: t("test.cat_choices"), q: questions.filter(q => q.category === "choices") },
            { label: t("test.cat_emotional"), q: questions.filter(q => q.category === "emotional") },
            { label: t("test.cat_unhealthy"), q: questions.filter(q => q.category === "unhealthy") },
            { label: t("test.cat_attitude"), q: questions.filter(q => q.category === "attitude") },
            { label: t("test.cat_supplements"), q: questions.filter(q => q.category === "supplements") },
          ].map(cat => (
            <div key={cat.label} className="mb-3">
              <h4 className="font-semibold mb-1">{cat.label}</h4>
              <div className="space-y-4">
                {cat.q.map(q => (
                  <div key={q.key} className="flex flex-col md:flex-row md:items-center gap-2">
                    <span className="min-w-[240px]">{t(`test.q_${q.key}`)}</span>
                    <div className="flex gap-3">
                      {options.map(opt => (
                        <label key={opt} className="flex flex-col items-center cursor-pointer">
                          <input
                            type="radio"
                            name={q.key}
                            value={opt}
                            checked={answers[q.key] === opt}
                            onChange={() => setAnswers(a => ({ ...a, [q.key]: opt }))}
                            className="sr-only"
                            required={true}
                          />
                          <span
                            className={`w-7 h-7 flex items-center justify-center rounded-full border-2 ${
                              answers[q.key] === opt
                                ? "bg-blue-500 text-white border-blue-700"
                                : "bg-white text-blue-900 border-blue-400"
                            }`}
                          >
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={filled < questions.length}
          className="mt-8 bg-blue-700 text-white rounded px-8 py-2 font-bold shadow transition hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("test.submit")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-4 mt-8 px-6 py-2 bg-gray-200 rounded text-blue-900 font-semibold hover:bg-gray-300 transition"
        >
          {t("test.cancel")}
        </button>
      </form>
    </div>
  );
}

export default EatingHabitsTest;
