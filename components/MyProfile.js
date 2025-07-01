import React, { useState } from "react";

// Sub-navbar/tab mygtukas
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-semibold transition-all
        ${active ? "bg-purple-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
      style={{ minWidth: 120 }}
    >
      {children}
    </button>
  );
}

// Asmeninė informacija
function ProfilePersonal() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Asmeninė informacija</h2>
      <div className="grid gap-3 max-w-md">
        <input className="border p-2 rounded" placeholder="Vardas" />
        <input className="border p-2 rounded" placeholder="El. paštas" type="email" />
        <input className="border p-2 rounded" placeholder="Telefono numeris" type="tel" />
        <input className="border p-2 rounded" placeholder="Gimimo data" type="date" />
        <select className="border p-2 rounded">
          <option value="">Lytis</option>
          <option value="male">Vyras</option>
          <option value="female">Moteris</option>
          <option value="other">Kita</option>
        </select>
        <input className="border p-2 rounded" placeholder="Šalis" />
        <input className="border p-2 rounded" placeholder="Miestas" />
        <select className="border p-2 rounded">
          <option value="">Pageidaujama kalba</option>
          <option value="lt">Lietuvių</option>
          <option value="en">English</option>
        </select>
        {/* Profilio nuotrauka */}
        <input className="border p-2 rounded" placeholder="Profilio nuotrauka (URL)" />
      </div>
    </div>
  );
}

// Fiziniai ir sveikatos duomenys
function ProfilePhysical() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Fiziniai duomenys ir sveikata</h2>
      <div className="grid gap-3 max-w-md">
        <input className="border p-2 rounded" placeholder="Ūgis (cm)" type="number" min={50} max={260} />
        <input className="border p-2 rounded" placeholder="Svoris (kg)" type="number" step="0.1" min={20} max={300} />
        <select className="border p-2 rounded">
          <option value="">Kūno tipas</option>
          <option value="ectomorph">Ektomorfas</option>
          <option value="mesomorph">Mezomorfas</option>
          <option value="endomorph">Endomorfas</option>
        </select>
        <input className="border p-2 rounded" placeholder="Sveikatos būklės / Diagnozės" />
        <input className="border p-2 rounded" placeholder="Alergijos" />
        <input className="border p-2 rounded" placeholder="Mitybos apribojimai / lėtinės ligos" />
        <input className="border p-2 rounded" placeholder="Vartojami vaistai" />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="insurance" />
          <label htmlFor="insurance">Turi sveikatos draudimą</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="smokes" />
          <label htmlFor="smokes">Rūko</label>
        </div>
        <input className="border p-2 rounded" placeholder="Vartoja alkoholį (apibūdinkite)" />
        <input className="border p-2 rounded" placeholder="Streso lygis (1–10)" type="number" min={1} max={10} />
        <input className="border p-2 rounded" placeholder="Motyvacija (1–10)" type="number" min={1} max={10} />
        <input className="border p-2 rounded" placeholder="Pagrindinės kliūtys" />
      </div>
    </div>
  );
}

// Gyvenimo būdas ir rutina
function ProfileRoutine() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Gyvenimo būdas ir rutina</h2>
      <div className="grid gap-3 max-w-md">
        <input className="border p-2 rounded" placeholder="Darbo tipas" />
        <input className="border p-2 rounded" placeholder="Darbo valandos per dieną" type="number" min={1} max={18} />
        <select className="border p-2 rounded">
          <option value="">Darbo grafikas</option>
          <option value="early">Ankstyvas</option>
          <option value="late">Vėlyvas</option>
          <option value="shift">Pamaininis</option>
          <option value="flexible">Lankstus</option>
          <option value="normal">Standartinis</option>
        </select>
        <input className="border p-2 rounded" placeholder="Miego valandos per parą" type="number" min={1} max={16} />
        <input className="border p-2 rounded" placeholder="Kelimosi laikas" type="time" />
        <input className="border p-2 rounded" placeholder="Einamo miego laikas" type="time" />
        <input className="border p-2 rounded" placeholder="Šeimos statusas" />
        <input className="border p-2 rounded" placeholder="Kiek valgymų per dieną?" type="number" min={1} max={10} />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="eatsOutOften" />
          <label htmlFor="eatsOutOften">Dažnai valgau ne namie</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="notifications" />
          <label htmlFor="notifications">Noriu gauti priminimus</label>
        </div>
      </div>
    </div>
  );
}

// Sporto aktyvumas
function ProfileActivity() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Sportas ir aktyvumas</h2>
      <div className="grid gap-3 max-w-md">
        <select className="border p-2 rounded">
          <option value="">Fizinio aktyvumo lygis</option>
          <option value="very_low">Labai žemas</option>
          <option value="low">Žemas</option>
          <option value="medium">Vidutinis</option>
          <option value="high">Aukštas</option>
          <option value="very_high">Labai aukštas</option>
        </select>
        <input className="border p-2 rounded" placeholder="Žingsnių per dieną" type="number" min={0} />
        <input className="border p-2 rounded" placeholder="Kokius sportus dabar lankote?" />
        <input className="border p-2 rounded" placeholder="Kiek minučių trunka treniruotė?" type="number" min={0} />
        <input className="border p-2 rounded" placeholder="Kiek treniruočių per savaitę?" type="number" min={0} max={14} />
        <select className="border p-2 rounded">
          <option value="">Kur sportuojate?</option>
          <option value="home">Namie</option>
          <option value="gym">Sporto salėje</option>
          <option value="outdoor">Lauke</option>
          <option value="other">Kita</option>
        </select>
        <input className="border p-2 rounded" placeholder="Kokia turite įrangą?" />
        <input className="border p-2 rounded" placeholder="Ką norėtumėte išbandyti?" />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="gymMember" />
          <label htmlFor="gymMember">Sporto klubo narys</label>
        </div>
        <input className="border p-2 rounded" placeholder="Fizinis pasiruošimo lygis" />
        <input className="border p-2 rounded" placeholder="Ankstesnė sporto patirtis" />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="wantsRestRecommendations" />
          <label htmlFor="wantsRestRecommendations">Noriu poilsio rekomendacijų</label>
        </div>
      </div>
    </div>
  );
}

// Mityba ir pageidavimai
function ProfileNutrition() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Mityba ir pageidavimai</h2>
      <div className="grid gap-3 max-w-md">
        <input className="border p-2 rounded" placeholder="Pagrindinis tikslas" />
        <input className="border p-2 rounded" placeholder="Mitybos tipas" />
        <input className="border p-2 rounded" placeholder="Mėgstami maisto produktai" />
        <input className="border p-2 rounded" placeholder="Nemėgstami maisto produktai" />
        <input className="border p-2 rounded" placeholder="Mėgstamos virtuvės rūšys" />
        <input className="border p-2 rounded" placeholder="Papildai / vitaminai" />
        <input className="border p-2 rounded" placeholder="Mitybos įpročiai" />
        <input className="border p-2 rounded" placeholder="Kiek kavos per dieną?" type="number" min={0} />
        <input className="border p-2 rounded" placeholder="Kiek arbatos per dieną?" type="number" min={0} />
        <input className="border p-2 rounded" placeholder="Cukraus kiekis per dieną (g)" type="number" min={0} />
      </div>
    </div>
  );
}

// Papildoma informacija ir motyvacija
function ProfileOther() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Papildoma informacija ir motyvacija</h2>
      <div className="grid gap-3 max-w-md">
        <input className="border p-2 rounded" placeholder="Kas jums trukdo siekti tikslų?" />
        <input className="border p-2 rounded" placeholder="Kaip apibrėžiate sėkmę?" />
        <select className="border p-2 rounded">
          <option value="">Planų atnaujinimo dažnis</option>
          <option value="weekly">Kas savaitę</option>
          <option value="monthly">Kas mėnesį</option>
          <option value="quarterly">Kas ketvirtį</option>
        </select>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="smartWatch" />
          <label htmlFor="smartWatch">Turi išmanų laikrodį</label>
        </div>
        <input className="border p-2 rounded" placeholder="Tikslų data" type="date" />
        <input className="border p-2 rounded" placeholder="Prieigos lygis" type="number" min={0} max={10} />
      </div>
    </div>
  );
}

// Pagrindinis MyProfile komponentas
export default function MyProfile() {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="p-8">
      {/* Sub-navbar/tabai */}
      <div className="flex flex-wrap gap-2 mb-8">
        <TabBtn active={activeTab === "personal"} onClick={() => setActiveTab("personal")}>
          Asmeninė info
        </TabBtn>
        <TabBtn active={activeTab === "physical"} onClick={() => setActiveTab("physical")}>
          Fiziniai duomenys
        </TabBtn>
        <TabBtn active={activeTab === "routine"} onClick={() => setActiveTab("routine")}>
          Gyvenimo būdas
        </TabBtn>
        <TabBtn active={activeTab === "activity"} onClick={() => setActiveTab("activity")}>
          Sportas
        </TabBtn>
        <TabBtn active={activeTab === "nutrition"} onClick={() => setActiveTab("nutrition")}>
          Mityba
        </TabBtn>
        <TabBtn active={activeTab === "other"} onClick={() => setActiveTab("other")}>
          Papildoma info
        </TabBtn>
      </div>

      {/* Rodoma aktyvi forma */}
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
        {activeTab === "personal" && <ProfilePersonal />}
        {activeTab === "physical" && <ProfilePhysical />}
        {activeTab === "routine" && <ProfileRoutine />}
        {activeTab === "activity" && <ProfileActivity />}
        {activeTab === "nutrition" && <ProfileNutrition />}
        {activeTab === "other" && <ProfileOther />}
      </div>
    </div>
  );
}
