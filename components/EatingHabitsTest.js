import React, { useState } from "react";
import { useTranslation } from "next-i18next";

// Klausimų sąrašas (visi teiginiai turi būti aprašyti vertimuose test.q_<key>)
const questions = [
  // I. Valgymo planavimas ir reguliarumas
  { key: "plan_meals", category: "planning" },         // Aš planuoju savo valgymus iš anksto.
  { key: "eat_regularly", category: "planning" },      // Aš valgau reguliariai, panašiu laiku kiekvieną dieną.
  { key: "late_eating", category: "planning" },        // Aš dažnai valgau vėlai vakare arba naktį.
  { key: "overeating", category: "planning" },         // Aš dažnai persivalgau, kai valgau.

  // II. Sveikų pasirinkimų darymas
  { key: "eat_vegetables", category: "choices" },      // Aš dažnai renkuosi daržoves savo racione.
  { key: "eat_fruits", category: "choices" },          // Aš dažnai valgau vaisius.
  { key: "cook_from_scratch", category: "choices" },   // Aš dažnai gaminu maistą iš šviežių produktų.
  { key: "try_healthy_recipes", category: "choices" }, // Aš mėgstu išbandyti sveikesnius receptus.
  { key: "read_labels", category: "choices" },         // Aš dažnai skaitau produktų etiketes.
  { key: "eat_fast", category: "choices" },            // Aš dažnai valgau greitai, neskirdamas laiko maistui.
  { key: "drink_water", category: "choices" },         // Aš pakankamai geriu vandens kasdien.
  { key: "choose_eco", category: "choices" },          // Aš stengiuosi rinktis ekologišką ar tvarų maistą.

  // III. Emocinis ir socialinis valgymas
  { key: "emotional_eating", category: "emotional" },  // Aš dažnai valgau dėl emocijų (liūdesio, streso, nuobodulio).
  { key: "mood_affects_eating", category: "emotional" }, // Mano nuotaika dažnai lemia, ką ar kiek valgau.
  { key: "social_overeat", category: "emotional" },    // Bendraudamas su kitais aš dažnai valgau daugiau nei norėčiau.
  { key: "restrict_binge", category: "emotional" },    // Aš dažnai riboju maistą, o vėliau persivalgau.
  { key: "feel_guilt", category: "emotional" },        // Po valgymo dažnai jaučiu kaltę arba priekaištus sau.

  // IV. Nesveiki įpročiai
  { key: "eat_fast_food", category: "unhealthy" },     // Aš dažnai valgau greitą maistą ar užkandžius.
  { key: "drink_sugary", category: "unhealthy" },      // Aš dažnai geriu saldžius gėrimus (limonadus, sultis).
  { key: "eat_with_screens", category: "unhealthy" },  // Dažnai valgau žiūrėdamas televizorių ar naršydamas telefone.
  { key: "eat_outside", category: "unhealthy" },       // Dažnai valgau ne namuose, kavinėse ar restoranuose.

  // V. Maisto suvokimas ir nuostatos
  { key: "think_fast_food_ok", category: "attitude" },     // Manau, kad greitas maistas nėra blogas, jei valgau kartais.
  { key: "taste_over_nutrition", category: "attitude" },   // Skonis man svarbiau už maistingumą.
  { key: "think_healthy_hard", category: "attitude" },     // Man atrodo, kad sveikai maitintis yra sudėtinga.
  { key: "mindless_eating", category: "attitude" },        // Dažnai valgau nesusimąstydamas, net nepajusdamas alkio.
  { key: "think_balanced", category: "attitude" },         // Man svarbu išlaikyti mitybos balansą ir įvairovę.

  // VI. Papildomi klausimai apie gyvenimo būdą
  { key: "take_supplements", category: "supplements" },    // Aš reguliariai vartoju maisto papildus ar vitaminus.

  // Papildomi – jei nori
  { key: "boredom_eating", category: "emotional" },        // Aš dažnai valgau iš nuobodulio, net jei nesu alkanas.
  { key: "snacking_unplanned", category: "unhealthy" },    // Aš dažnai užkandžiauju neplanuotai tarp pagrindinių valgymų.
  { key: "appearance_over_nutrition", category: "attitude" }, // Dažnai renkuosi maistą pagal išvaizdą, ne pagal naudą.
  { key: "fail_diet_plans", category: "attitude" },        // Dažnai bandau laikytis dietos, bet greitai grįžtu prie senų įpročių.
];

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

  const handleSubmit = e => {
    e.preventDefault();
    alert(t("test.thank_you"));
    onClose();
  };

  // Kategorijų aprašai (pritaikyti stiliui ir kategorijų tvarkai)
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
                  const globalIndex = questions.findIndex(item => item.key === q.key) + 1;
                  return (
                    <div
                      key={q.key}
                      className="bg-white border rounded-xl shadow-md p-5 flex flex-col gap-2 transition hover:shadow-xl"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg text-blue-900">{globalIndex} / {total}</span>
                      </div>
                      {/* Klausimas pateikiamas kaip teiginys */}
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
