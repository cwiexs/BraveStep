import React, { useState } from "react";

/*
 * WorkoutPlayer priima:
 * - workoutData: visas treniruotės planas (objektas su days, exercises, motivationStart, motivationEnd ir t.t.)
 * - planId: duomenų bazės plano ID (uuid)
 * - onClose: funkcija uždaryti modalą ar treniruotės langą
 */
export default function WorkoutPlayer({ workoutData, planId, onClose }) {
  // UI valdymo kintamieji
  const [currentDay, setCurrentDay] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [inProgress, setInProgress] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Feedback ir motyvacija
  const [rating, setRating] = useState(3); // 1–5: 1 – sunku, 3 – balansas, 5 – lengva
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Saugiklis nuo blogų props
  if (!workoutData || !planId) {
    return (
      <div className="text-red-500 p-4">
        Klaida: Trūksta treniruotės duomenų arba plano ID.  
        Prašome susisiekti su administratoriumi.
      </div>
    );
  }

  // Treniruotės duomenys
  const days = workoutData.days || [];
  const exercises = days[currentDay]?.exercises || [];

  // Pradėti treniruotę
  function handleStart() {
    setInProgress(true);
  }

  // Eiti prie kito pratimo arba užbaigti treniruotę
  function handleNext() {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise((n) => n + 1);
    } else if (currentDay < days.length - 1) {
      setCurrentDay((d) => d + 1);
      setCurrentExercise(0);
    } else {
      setIsComplete(true);
      setInProgress(false);
    }
  }

  // Siųsti atsiliepimą
  async function submitFeedback() {
    try {
      await fetch("/api/complete-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planId,
          difficultyRating: rating,
          userComment: comment,
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      alert("Nepavyko išsaugoti atsiliepimo. Bandykite dar kartą.");
    }
  }

  // MOTYVACINIS LANGAS PRADŽIOJE
  if (!inProgress && !isComplete) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{workoutData.title || "Tavo treniruotė"}</h2>
        <p className="mb-4">{workoutData.motivationStart || "Pradėk stipriai!"}</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleStart}
        >
          Pradėti treniruotę
        </button>
        <button
          className="ml-2 px-4 py-2 bg-gray-200 rounded"
          onClick={onClose}
        >
          Atšaukti
        </button>
      </div>
    );
  }

  // TRENIRUOTĖ (per visus pratimus)
  if (inProgress && !isComplete) {
    const exercise = exercises[currentExercise];
    return (
      <div className="p-6">
        <div className="mb-2 font-semibold">Diena {currentDay + 1} iš {days.length}</div>
        <h3 className="text-xl mb-2">{exercise?.name}</h3>
        <p className="mb-4">{exercise?.description}</p>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={handleNext}
        >
          {currentExercise < exercises.length - 1
            ? "Sekantis pratimas"
            : currentDay < days.length - 1
            ? "Sekanti diena"
            : "Pabaiga"}
        </button>
      </div>
    );
  }

  // PABAIGOS LANGAS SU ĮVERTINIMU
  if (isComplete) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">Sveikiname! Treniruotė baigta 🎉</h2>
        <p className="mb-2">{workoutData.motivationEnd || "Puikiai padirbėta!"}</p>
        {!submitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitFeedback();
            }}
          >
            <div className="mb-4">
              <label className="block mb-1 font-semibold">
                Kaip įvertintum treniruotę?
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      rating === value ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="text-sm mt-1 text-gray-500">
                {rating === 3
                  ? "Tobulas balansas"
                  : rating < 3
                  ? "Per sunku"
                  : "Per lengva"}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-semibold">
                Tavo komentaras (nebūtina):
              </label>
              <textarea
                className="w-full border rounded p-2"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Siųsti atsiliepimą ir uždaryti
            </button>
          </form>
        ) : (
          <div className="text-green-700 font-bold text-lg mt-4">
            Ačiū už tavo įvertinimą!
          </div>
        )}
      </div>
    );
  }

  // Jeigu visgi kas nors nelogiškai užlūžtų
  return (
    <div className="text-red-500 p-4">
      Klaida: Nežinoma treniruotės būsena. Susisiek su kūrėjais.
    </div>
  );
}
