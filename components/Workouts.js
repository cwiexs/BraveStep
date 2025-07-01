import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

export default function Workouts() {
  const { data: session, status } = useSession();
  const { t } = useTranslation("workouts"); // naudosim atskirą vertimų failą, jei norėsi

  if (status === "loading") {
    return <div>{t("loading") || "Kraunasi..."}</div>;
  }

  // Prisijungęs
  if (session) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">{t("title") || "Workouts"}</h1>
        <p className="mb-4 text-lg">{t("welcomeLoggedIn") || "Sveikiname prisijungus! Galite generuoti naujus workout'us, peržiūrėti ankstesnius, pasirinkti el. pašto pranešimus ir t.t."}</p>
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition">{t("generateWorkout") || "Generuoti naują treniruotę"}</button>
        {/* Čia bus pasirinkimai: checkboxai, mygtukai, ar norite gauti el. laišką, ir t.t. */}
      </div>
    );
  }

  // Neprisijungęs
  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl shadow-lg text-center">
      <h1 className="text-3xl font-bold mb-6 text-blue-900">{t("title") || "Workouts"}</h1>
      <p className="mb-4 text-lg">{t("welcomeGuest") || "Norėdami gauti personalizuotus workout'us, prisijunkite arba užsiregistruokite! Visi workout'ai generuojami dirbtinio intelekto pagalba."}</p>
      <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold shadow transition">{t("signInToGenerate") || "Prisijunkite, kad generuotumėte workout'ą"}</button>
    </div>
  );
}
