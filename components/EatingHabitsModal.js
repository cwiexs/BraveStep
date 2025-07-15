import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { eatingHabitsQuestions } from "./eatingHabitsQuestions";

const EatingHabitsModal = ({ onSubmit }) => {
  const { t } = useTranslation("eatingHabits");
  const [answers, setAnswers] = useState({});

  const handleChange = (questionKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: parseInt(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-gray-700">{t("instructions")}</p>
      {eatingHabitsQuestions.map((question) => (
        <div key={question.key} className="mb-4">
          <label className="block mb-2 font-medium text-blue-900">
            {t(question.label)}
          </label>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={question.key}
                  value={value}
                  checked={answers[question.key] === value}
                  onChange={() => handleChange(question.key, value)}
                  className="text-blue-700"
                />
                {value}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="submit"
        className="bg-blue-700 text-white rounded px-4 py-2 font-medium hover:bg-blue-800 transition"
      >
        {t("form.submit")}
      </button>
    </form>
  );
};

export default EatingHabitsModal;