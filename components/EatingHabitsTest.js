import React, { useState } from "react";
import { useTranslation } from "next-i18next";

// Klausimų sąrašas (nekeičiama dalis)
const questions = [
  // ... (visas tavo klausimų masyvas iš failo - nekeičiam)
  // (liko taip pat, kaip tavo faile)
  // ...
  { key: "plan_meals", category: "planning" },         
  { key: "eat_regularly", category: "planning" },      
  { key: "late_eating", category: "planning" },        
  { key: "overeating", category: "planning" },         
  { key: "eat_vegetables", category: "choices" },      
  { key: "eat_fruits", category: "choices" },          
  { key: "cook_from_scratch", category: "choices" },   
  { key: "try_healthy_recipes", category: "choices" }, 
  { key: "read_labels", category: "choices" },         
  { key: "eat_fast", category: "choices" },            
  { key: "drink_water", category: "choices" },         
  { key: "choose_eco", category: "choices" },          
  { key: "emotional_eating", category: "emotional" },  
  { key: "mood_affects_eating", category: "emotional" },
  { key: "social_overeat", category: "emotional" },    
  { key: "restrict_binge", category: "emotional" },    
  { key: "feel_guilt", category: "emotional" },        
  { key: "eat_fast_food", category: "unhealthy" },     
  { key: "drink_sugary", category: "unhealthy" },      
  { key: "eat_with_screens", category: "unhealthy" },  
  { key: "eat_outside", category: "unhealthy" },       
  { key: "think_fast_food_ok", category: "attitude" },     
  { key: "taste_over_nutrition", category: "attitude" },   
  { key: "think_healthy_hard", category: "attitude" },     
  { key: "mindless_eating", category: "attitude" },        
  { key: "think_balanced", category: "attitude" },         
  { key: "take_supplements", category: "supplements" },    
  { key: "boredom_eating", category: "emotional" },        
  { key: "snacking_unplanned", category: "unhealthy" },    
  { key: "appearance_over_nutrition", category: "attitude" },
  { key: "fail_diet_plans", category: "attitude" },        
];

const categoryColors = {
  planning: "bg-blue-100 text-blue-700",
  choices: "bg-green-100 text-green-700",
  emotional: "bg-pink-100 text-pink-700",
  unhealthy: "bg-yellow-100 text-yellow-700",
  attitude: "bg-purple-100 text-purple-700",
  supplements: "bg-gray-100 text-gray-700",
};

function EatingHabitsTest({ onClose, onComplete }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null); // naujas error state

  const options = [1, 2, 3, 4, 5];
  const filled = Object.keys(answers).length;
  const total = questions.length;
  const percent = Math.round((filled / total) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();


    //tikrinam 
    console.log("SUBMITO FUNKCIJA TRIGGERINTA", answers);
    setLoading(true);
    setDone(false);
    setError(null);
    try {
      const resp = await fetch('/api/generate-eating-habits-report', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!resp.ok) {
        // Perskaityk pilną klaidos tekstą ir parodyk
        const errText = await resp.text();
        setError("Serverio klaida: " + errText);
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setDone(true);

      if (onComplete && typeof onComplete === "function") {
        onComplete(data.date || new Date().toISOString());
      }

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1500);
    } catch (e) {
      setError("Tinklo arba serverio klaida: " + (e.message || e));
      setLoading(false);
    }
  };

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
                  const globalIndex = questions.findIndex(item => item.key === q.key) + 1;
                  return (
                    <div
                      key={q.key}
                      className="bg-white border rounded-xl shadow-md p-5 flex flex-col gap-2 transition hover:shadow-xl"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg text-blue-900">{globalIndex} / {total}</span>
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
                              disabled={loading}
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
                  );
                })}
              </div>
            </div>
          );
        })}
 <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-10">
          <button
            type="submit"
            disabled={filled < total || loading}
            className="bg-blue-700 text-white rounded px-10 py-3 font-bold shadow-lg transition hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading
              ? done
                ? t("test.completed")
                : t("test.generating")
              : t("test.submit")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-gray-200 rounded text-blue-900 font-semibold hover:bg-gray-300 transition text-lg shadow"
            // disabled={loading}
          >
            {t("test.cancel")}
          </button>
        </div>
        {/* Klaidos pranešimas */}
        {error && (
          <div className="mt-6 text-red-700 bg-red-100 border border-red-300 rounded-lg p-4 text-center font-semibold text-lg">
            {error}
          </div>
        )}
        {loading && !done && (
          <div className="mt-6 text-blue-600 text-center font-semibold text-lg animate-pulse">
            {t("test.generating")}
          </div>
        )}
        {done && (
          <div className="mt-6 text-green-600 text-center font-bold text-xl">
            {t("test.completed")}
          </div>
        )}
      </form>
    </div>
  );
}

export default EatingHabitsTest;