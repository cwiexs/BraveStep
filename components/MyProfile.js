import React, { useEffect, useState } from "react";

// Pritaikyk šį endpointą, jei tavo API kitoks:
const API_URL = "/api/users";

const TABS = [
  { key: "personal", label: "Asmeninė informacija" },
  { key: "activity", label: "Fizinis aktyvumas" },
  { key: "nutrition", label: "Mityba" },
  { key: "preferences", label: "Pageidavimai / papildoma info" },
];

const initialData = {
  // Prisma schema laukai (pritaikyk pagal savo laukus, jei reikia)
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  city: "",
  country: "",
  weightKg: "",
  heightCm: "",
  accessLevel: 0,
  jobType: "",
  workHoursPerDay: "",
  bedTime: "",
  sleepHours: "",
  goal: "",
  // Nutrition ir health
  dietaryPreference: "",
  allergies: "",
  chronicDiseases: "",
  injuries: "",
  // Preferences
  language: "lt",
  preferredTrainingTime: "",
  gymMember: false,
  trainingLocation: "",
  sports: "",
  activityLevel: "",
  availableTime: "",
  favoriteActivities: "",
  additionalNotes: "",
};

function validateField(name, value) {
  switch (name) {
    case "name":
      return typeof value === "string" && value.length <= 50;
    case "email":
      return (
        typeof value === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
        value.length <= 100
      );
    case "phone":
      return typeof value === "string" && /^[0-9+\-\s]*$/.test(value) && value.length <= 20;
    case "city":
      return typeof value === "string" && value.length <= 50;
    case "country":
      return typeof value === "string" && value.length <= 50;
    case "weightKg":
      return value === "" || (!isNaN(Number(value)) && Number(value) > 0 && Number(value) < 500);
    case "heightCm":
      return value === "" || (!isNaN(Number(value)) && Number(value) > 0 && Number(value) < 300);
    case "jobType":
      return typeof value === "string" && value.length <= 50;
    case "workHoursPerDay":
      return value === "" || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 24);
    case "bedTime":
      return typeof value === "string" && value.length <= 5;
    case "sleepHours":
      return value === "" || (!isNaN(Number(value)) && Number(value) > 0 && Number(value) <= 24);
    case "goal":
      return typeof value === "string" && value.length <= 100;
    case "dietaryPreference":
      return typeof value === "string" && value.length <= 50;
    case "allergies":
      return typeof value === "string" && value.length <= 200;
    case "chronicDiseases":
      return typeof value === "string" && value.length <= 200;
    case "injuries":
      return typeof value === "string" && value.length <= 200;
    case "language":
      return typeof value === "string" && value.length <= 10;
    case "preferredTrainingTime":
      return typeof value === "string" && value.length <= 50;
    case "trainingLocation":
      return typeof value === "string" && value.length <= 50;
    case "sports":
      return typeof value === "string" && value.length <= 100;
    case "activityLevel":
      return typeof value === "string" && value.length <= 50;
    case "availableTime":
      return typeof value === "string" && value.length <= 50;
    case "favoriteActivities":
      return typeof value === "string" && value.length <= 200;
    case "additionalNotes":
      return typeof value === "string" && value.length <= 500;
    default:
      return true;
  }
}

function getFieldsForTab(tab) {
  switch (tab) {
    case "personal":
      return [
        { name: "name", label: "Vardas, pavardė", type: "text", required: true },
        { name: "email", label: "El. paštas", type: "email", required: true, disabled: true },
        { name: "phone", label: "Telefono numeris", type: "text", required: false },
        { name: "dateOfBirth", label: "Gimimo data", type: "date", required: false },
        { name: "gender", label: "Lytis", type: "select", options: ["", "vyras", "moteris", "kita"], required: false },
        { name: "city", label: "Miestas", type: "text", required: false },
        { name: "country", label: "Šalis", type: "text", required: false },
        { name: "accessLevel", label: "Prieigos lygis", type: "number", required: true, min: 0, max: 9, disabled: true },
      ];
    case "activity":
      return [
        { name: "weightKg", label: "Svoris (kg)", type: "number", required: false, min: 20, max: 400, step: "0.1" },
        { name: "heightCm", label: "Ūgis (cm)", type: "number", required: false, min: 100, max: 250, step: "1" },
        { name: "jobType", label: "Darbo pobūdis", type: "text", required: false },
        { name: "workHoursPerDay", label: "Darbo val. per dieną", type: "number", required: false, min: 0, max: 24, step: "0.5" },
        { name: "bedTime", label: "Eina miegoti (pvz. 22:30)", type: "text", required: false },
        { name: "sleepHours", label: "Miego valandų", type: "number", required: false, min: 1, max: 14, step: "0.1" },
        { name: "goal", label: "Pagrindinis tikslas", type: "text", required: false },
        { name: "preferredTrainingTime", label: "Pageidaujamas treniruočių laikas", type: "text", required: false },
        { name: "gymMember", label: "Sporto klubo narys?", type: "checkbox", required: false },
        { name: "trainingLocation", label: "Sportuojama kur?", type: "text", required: false },
        { name: "sports", label: "Kokios sporto šakos?", type: "text", required: false },
        { name: "activityLevel", label: "Aktyvumo lygis", type: "text", required: false },
        { name: "availableTime", label: "Kiek laiko skiriate sportui per savaitę?", type: "text", required: false },
        { name: "injuries", label: "Traumos", type: "text", required: false },
      ];
    case "nutrition":
      return [
        { name: "dietaryPreference", label: "Mitybos tipas (pvz. veganas)", type: "text", required: false },
        { name: "allergies", label: "Alergijos", type: "text", required: false },
        { name: "chronicDiseases", label: "Lėtinės ligos", type: "text", required: false },
      ];
    case "preferences":
      return [
        { name: "language", label: "Pageidaujama kalba", type: "select", options: ["lt", "en", "ru", "pl"], required: true },
        { name: "favoriteActivities", label: "Mėgstamos veiklos", type: "text", required: false },
        { name: "additionalNotes", label: "Papildoma informacija", type: "textarea", required: false },
      ];
    default:
      return [];
  }
}

function FormSection({ fields, values, onChange, errors }) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col">
          <label className="font-semibold text-sm mb-1">{f.label}</label>
          {f.type === "select" ? (
            <select
              name={f.name}
              value={values[f.name] || ""}
              disabled={f.disabled}
              onChange={onChange}
              className="border rounded px-2 py-1"
            >
              {(f.options || []).map((op) => (
                <option key={op} value={op}>
                  {op === "" ? "(nepasirinkta)" : op}
                </option>
              ))}
            </select>
          ) : f.type === "checkbox" ? (
            <input
              type="checkbox"
              name={f.name}
              checked={!!values[f.name]}
              disabled={f.disabled}
              onChange={onChange}
              className="h-5 w-5"
            />
          ) : f.type === "textarea" ? (
            <textarea
              name={f.name}
              value={values[f.name] || ""}
              disabled={f.disabled}
              onChange={onChange}
              className="border rounded px-2 py-1 min-h-[80px]"
            />
          ) : (
            <input
              type={f.type}
              name={f.name}
              value={values[f.name] ?? ""}
              disabled={f.disabled}
              onChange={onChange}
              className="border rounded px-2 py-1"
              min={f.min}
              max={f.max}
              step={f.step}
            />
          )}
          {errors[f.name] && (
            <span className="text-red-500 text-xs mt-1">{errors[f.name]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState("personal");
  const [userData, setUserData] = useState(initialData);
  const [originalData, setOriginalData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState({});

  // Užkrauna duomenis iš API
  useEffect(() => {
    setLoading(true);
    fetch(API_URL, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUserData({ ...initialData, ...data });
        setOriginalData({ ...initialData, ...data });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setErrorMsg("Nepavyko užkrauti duomenų.");
      });
  }, []);

  // Patikrina ar yra pakeitimų šiame tabe
  function isTabChanged(tab) {
    const fields = getFieldsForTab(tab);
    return fields.some((f) => {
      if (f.type === "checkbox")
        return !!userData[f.name] !== !!originalData[f.name];
      return (userData[f.name] ?? "") !== (originalData[f.name] ?? "");
    });
  }

  // Validoja laukus, grąžina klaidų objektą (jei yra)
  function validateTab(tab) {
    const fields = getFieldsForTab(tab);
    const newErrors = {};
    fields.forEach((f) => {
      if (f.required && (userData[f.name] === "" || userData[f.name] == null)) {
        newErrors[f.name] = "Privalomas laukas";
      } else if (!validateField(f.name, userData[f.name])) {
        newErrors[f.name] = "Neteisingas formatas arba viršytas ilgis";
      }
    });
    return newErrors;
  }

  function handleInputChange(e) {
    const { name, type, value, checked } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  }

  // Išsaugo TIK šio tabo laukus
  function handleSave(tab) {
    setSuccessMsg("");
    setErrorMsg("");
    const tabFields = getFieldsForTab(tab).map((f) => f.name);
    const newErrors = validateTab(tab);
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    setSaving(true);

    const toUpdate = {};
    tabFields.forEach((f) => {
      if (userData[f] !== originalData[f]) {
        toUpdate[f] = userData[f];
      }
    });

    fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(toUpdate),
    })
      .then((res) => {
        if (res.ok) {
          setSuccessMsg("Sėkmingai išsaugota!");
          setOriginalData((prev) => ({ ...prev, ...toUpdate }));
        } else {
          setErrorMsg("Klaida išsaugant duomenis.");
        }
        setSaving(false);
      })
      .catch(() => {
        setErrorMsg("Nepavyko išsaugoti duomenų.");
        setSaving(false);
      });
  }

  // Pranešimas po išsaugojimo išnyksta po 2,5 s
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Mano profilis</h2>

      {/* Tab navigacija */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t-lg font-semibold ${
              activeTab === tab.key
                ? "bg-blue-700 text-white"
                : "bg-blue-100 text-blue-800"
            }`}
            disabled={loading}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Duomenys kraunami...</div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(activeTab);
          }}
          className="flex flex-col gap-6"
        >
          <FormSection
            fields={getFieldsForTab(activeTab)}
            values={userData}
            onChange={handleInputChange}
            errors={errors}
          />
          <div className="flex items-center mt-4 gap-4">
            <button
              type="submit"
              className={`px-6 py-2 rounded bg-blue-700 text-white font-bold transition disabled:bg-gray-300`}
              disabled={!isTabChanged(activeTab) || saving}
            >
              {saving ? "Saugoma..." : "Išsaugoti"}
            </button>
            {successMsg && <span className="text-green-700">{successMsg}</span>}
            {errorMsg && <span className="text-red-600">{errorMsg}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
