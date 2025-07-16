import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState } from "react";

export default function EatingHabitsTest() {
  const { data: session, status } = useSession();
  const { t } = useTranslation("common");

  const [answers, setAnswers] = useState({
    breakfastRegularity: 3,
    waterIntake: 3,
    lateNightEating: 3,
    snackingFrequency: 3,
    balancedMeals: 3,
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleChange = (question, value) => {
    setAnswers(prev => ({ ...prev, [question]: Number(value) }));
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/generate-eating-habits-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          preferredLanguage: "lt", // arba "en", jei reikia anglų
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

  if (status === "loading") return <div>{t("loading")}</div>;

  if (!session) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">{t("eatingHabitsTest")}</h1>
        <p className="mb-4 text-lg">{t("pleaseSignInToContinue")}</p>
        <button className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow">
          {t("signIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-blue-900 text-center">{t("eatingHabitsTest")}</h1>
      <p className="mb-8 text-lg text-center">{t("answerInstructions")}</p>

      <form className="space-y-6">
        <QuestionSlider
          label={t("breakfastRegularity")}
          name="breakfastRegularity"
          value={answers.breakfastRegularity}
          onChange={handleChange}
        />
        <QuestionSlider
          label={t("waterIntake")}
          name="waterIntake"
          value={answers.waterIntake}
          onChange={handleChange}
        />
        <QuestionSlider
          label={t("lateNightEating")}
          name="lateNightEating"
          value={answers.lateNightEating}
          onChange={handleChange}
        />
        <QuestionSlider
          label={t("snackingFrequency")}
          name="snackingFrequency"
          value={answers.snackingFrequency}
          onChange={handleChange}
        />
        <QuestionSlider
          label={t("balancedMeals")}
          name="balancedMeals"
          value={answers.balancedMeals}
          onChange={handleChange}
        />
      </form>

      <div className="text-center mt-8">
        <button
          onClick={handleGenerateReport}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
          disabled={loading}
        >
          {loading ? t("generating") : t("generateReport")}
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

function QuestionSlider({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-2">
        {label}: <span className="text-blue-900 font-bold">{value}</span>
      </label>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={e => onChange(name, e.target.value)}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-gray-500 mt-1">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );
}
