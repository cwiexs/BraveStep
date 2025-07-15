import React, { useState } from "react";
import { useTranslation } from "next-i18next";

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

// Spalvos kiekvienai kategorijai
const categoryColors = {
  planning: "bg-blue-100 text-blue-700",
  choices: "bg-green-100 text-green-700",
  emotional: "bg-pink-100 text-pink-700",
  unhealthy: "bg-yellow-100 text-yellow-700",
  attitude: "bg-purple-100 text-purple-700",
  supplements: "bg-gray-100 text-gray-700",
};

function EatingHabitsTest({ onClose }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const options = [1, 2, 3, 4, 5];
  const filled = Object.keys(answers).length;
  const total = questions.length;
  const percent = Math.round((filled / total) * 100);

  // Pagal klausimų kategoriją grąžina jų skaičių
  const getCategoryIndex = (category, index) => {
    let idx = 1;
    for (let i = 0; i < index; i++) {
      if (questions[i].category === category) idx++;
    }
    return idx;
  };

  const handleSubmit = e => {
    e.preventDefault();
    alert(t("test.thank_you"));
    onClose();
  };

  // Suskirstome klausimus pagal kategorijas, kad būtų galima priskirti kategorijos pavadinimą ir spalvą
  const categories = [
    { key: "planning", label: t("test.cat_planning") },
    { key: "choices", label: t("test.cat_choices") },
    { key: "emotional", label: t("test.cat_emotional") },
    { key: "unhealthy", label: t("test.cat_unhealthy") },
    { key: "attitude", label: t("test.cat_attitude") },
    { key: "supplements", label: t("test.cat_supplements") },
  ];

  return (
    <div>
      <h3 className="text-2xl font-bold mb-3 text-blue-800">{t("test.introTitle")}</h3>
      <p className="mb-6 text-gray-700">{t("test.introText")}</p>

      {/* Progreso juosta */}
      <div className="w-full h-4 bg-gray-200 rounded mb-8">
        <div
          className="h-4 bg-blue-500 rounded transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <form onSubmit={handleSubmit}>
        {categories.map(cat => {
          const qs = questions.filter(q => q.category === cat.key);
          if (qs.length === 0) return null;
          return (
            <div key={cat.key} className="mb-6">
              <div className={`inline-block px-3 py-1 mb-4 rounded-full font-semibold ${categoryColors[cat.key]} shadow-sm`}>
                {cat.label}
              </div>
              <div className="space-y-6">
                {qs.map((q, qIdx) => {
                  // Bendra klausimo numeracija (pagal bendrą sąrašą)
                  const globalIndex = questions.findIndex(item => item.key === q.key) + 1;
                  return (
                    <div
                      key={q.key}
                      className="bg-white border rounded-xl shadow-md p-5 flex flex-col gap-2 transition hover:shadow-xl"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg text-blue-900">{globalIndex} / {total}</span>
                        {/* Galima pridėti ir pavadinimą ar subkategoriją */}
                      </div>
                      <span className="mb-2 font-medium text-gray-800 break-words">{t(`test.q_${q.key}`)}</span>
                      <div className="flex flex-row gap-3 mt-2 justify-center">
                        {options.map(opt => (
                          <label
                            key={opt}
                            className={`flex flex-col items-center cursor-pointer group`}
                            title={opt}
                          >
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
                      {/* Optional: Aprašas po klausimu */}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-10">
          <button
            type="submit"
            disabled={filled < total}
            className="bg-blue-700 text-white rounded px-10 py-3 font-bold shadow-lg transition hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {t("test.submit")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-gray-200 rounded text-blue-900 font-semibold hover:bg-gray-300 transition text-lg shadow"
          >
            {t("test.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EatingHabitsTest;
