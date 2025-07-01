import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { CheckCircle2, Info } from "lucide-react";

// Info tooltip komponentas (suderintas su lokalizacija)
const InfoTooltip = ({ infoKey }) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  if (!infoKey) return null;
  return (
    <span className="relative ml-2">
      <button
        type="button"
        tabIndex={-1}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 bg-gray-50 text-xs text-blue-700 hover:bg-blue-100"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label="Informacija"
      >
        <Info size={14} />
      </button>
      {show && (
        <span className="absolute z-50 left-6 top-1 w-64 bg-white border border-blue-300 rounded shadow-lg text-xs text-gray-700 p-3">
          {t(infoKey)}
        </span>
      )}
    </span>
  );
};

// Multiinput komponentas masyvams (alergijos, mėgstami maistai ir pan.)
const MultiInput = ({ value, onChange, placeholder }) => {
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((v, i) => (
        <span
          key={i}
          className="flex items-center gap-1 bg-blue-50 rounded-full px-2 py-1 text-sm border"
        >
          {v}
          <button
            type="button"
            className="ml-1 text-blue-600"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            aria-label="Pašalinti"
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="min-w-[80px] flex-1 border rounded px-2 py-1 text-sm"
        placeholder={placeholder || ""}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if ((e.key === "Enter" || e.key === "," || e.key === "Tab") && input.trim() !== "") {
            e.preventDefault();
            if (!value.includes(input.trim()))
              onChange([...value, input.trim()]);
            setInput("");
          }
          if (e.key === "Backspace" && input === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
};

// ENUM'ų select'ai su "Kita" logika
const EnumSelect = ({
  name, value, onChange, options, otherValue, setOtherValue, labelOther, infoKey,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <select
        name={name}
        className="w-full border rounded px-2 py-2"
        value={options.includes(value) ? value : value === "other" ? "other" : ""}
        onChange={e => {
          if (e.target.value === "other") {
            onChange("other");
          } else {
            onChange(e.target.value);
          }
        }}
      >
        <option value="" disabled>
          {t("form.select")}
        </option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {labelOther(opt)}
          </option>
        ))}
        <option value="other">{t("form.other")}</option>
      </select>
      {value === "other" && (
        <input
          type="text"
          className="border rounded px-2 py-2 w-32"
          value={otherValue || ""}
          onChange={e => setOtherValue(e.target.value)}
          placeholder={t("form.enterOther") || "Enter..."}
        />
      )}
      <InfoTooltip infoKey={infoKey} />
    </div>
  );
};



// Visų laukų ir sekcijų konfigūracija (generuojama iš schema.prisma, pavadinimai - infoKey ir label universalūs)
const sections = [
  {
    key: "personal",
    title: "section.personal",
    fields: [
      {
        name: "name",
        label: "form.name",
        type: "text",
        infoKey: "info.name",
      },
      {
        name: "email",
        label: "form.email",
        type: "email",
        readOnly: true,
        infoKey: "info.email",
      },
      {
        name: "phone",
        label: "form.phone",
        type: "text",
        infoKey: "info.phone",
      },
      {
        name: "preferredLanguage",
        label: "form.preferredLanguage",
        type: "text",
        infoKey: "info.preferredLanguage",
      },
      {
        name: "dateOfBirth",
        label: "form.dateOfBirth",
        type: "date",
        infoKey: "info.dateOfBirth",
      },
      {
        name: "gender",
        label: "form.gender",
        type: "enum",
        options: ["male", "female", "other"],
        infoKey: "info.gender",
      },
      {
        name: "city",
        label: "form.city",
        type: "text",
        infoKey: "info.city",
      },
      {
        name: "country",
        label: "form.country",
        type: "text",
        infoKey: "info.country",
      },
      {
        name: "profilePhotoUrl",
        label: "form.profilePhotoUrl",
        type: "text",
        infoKey: "info.profilePhotoUrl",
      },
    ],
  },
  {
    key: "body",
    title: "section.body",
    fields: [
      {
        name: "heightCm",
        label: "form.heightCm",
        type: "number",
        infoKey: "info.heightCm",
      },
      {
        name: "weightKg",
        label: "form.weightKg",
        type: "number",
        infoKey: "info.weightKg",
      },
      {
        name: "bodyType",
        label: "form.bodyType",
        type: "enum",
        options: ["ectomorph", "mesomorph", "endomorph", "unknown", "other"],
        infoKey: "info.bodyType",
      },
      {
        name: "fitnessLevel",
        label: "form.fitnessLevel",
        type: "enum",
        options: ["beginner", "intermediate", "advanced", "other"],
        infoKey: "info.fitnessLevel",
      },
    ],
  },
  {
    key: "health",
    title: "section.health",
    fields: [
      {
        name: "healthConditions",
        label: "form.healthConditions",
        type: "array",
        infoKey: "info.healthConditions",
      },
      {
        name: "allergies",
        label: "form.allergies",
        type: "array",
        infoKey: "info.allergies",
      },
      {
        name: "foodRestrictions",
        label: "form.foodRestrictions",
        type: "array",
        infoKey: "info.foodRestrictions",
      },
      {
        name: "medications",
        label: "form.medications",
        type: "array",
        infoKey: "info.medications",
      },
      {
        name: "hasInsurance",
        label: "form.hasInsurance",
        type: "boolean",
        infoKey: "info.hasInsurance",
      },
      {
        name: "smokes",
        label: "form.smokes",
        type: "boolean",
        infoKey: "info.smokes",
      },
      {
        name: "alcohol",
        label: "form.alcohol",
        type: "text",
        infoKey: "info.alcohol",
      },
      {
        name: "stressLevel",
        label: "form.stressLevel",
        type: "number",
        infoKey: "info.stressLevel",
      },
      {
        name: "familyStatus",
        label: "form.familyStatus",
        type: "text",
        infoKey: "info.familyStatus",
      },
    ],
  },
  {
    key: "nutrition",
    title: "section.nutrition",
    fields: [
      {
        name: "mealsPerDay",
        label: "form.mealsPerDay",
        type: "number",
        infoKey: "info.mealsPerDay",
      },
      {
        name: "eatsOutOften",
        label: "form.eatsOutOften",
        type: "boolean",
        infoKey: "info.eatsOutOften",
      },
      {
        name: "dietType",
        label: "form.dietType",
        type: "text",
        infoKey: "info.dietType",
      },
      {
        name: "favoriteFoods",
        label: "form.favoriteFoods",
        type: "array",
        infoKey: "info.favoriteFoods",
      },
      {
        name: "dislikedFoods",
        label: "form.dislikedFoods",
        type: "array",
        infoKey: "info.dislikedFoods",
      },
      {
        name: "cuisinePreference",
        label: "form.cuisinePreference",
        type: "array",
        infoKey: "info.cuisinePreference",
      },
      {
        name: "supplements",
        label: "form.supplements",
        type: "array",
        infoKey: "info.supplements",
      },
      {
        name: "eatingHabits",
        label: "form.eatingHabits",
        type: "text",
        infoKey: "info.eatingHabits",
      },
      {
        name: "coffeePerDay",
        label: "form.coffeePerDay",
        type: "number",
        infoKey: "info.coffeePerDay",
      },
      {
        name: "teaPerDay",
        label: "form.teaPerDay",
        type: "number",
        infoKey: "info.teaPerDay",
      },
      {
        name: "sugarPerDay",
        label: "form.sugarPerDay",
        type: "number",
        infoKey: "info.sugarPerDay",
      },
    ],
  },
  {
    key: "lifestyle",
    title: "section.lifestyle",
    fields: [
      {
        name: "jobType",
        label: "form.jobType",
        type: "text",
        infoKey: "info.jobType",
      },
      {
        name: "workHoursPerDay",
        label: "form.workHoursPerDay",
        type: "number",
        infoKey: "info.workHoursPerDay",
      },
      {
        name: "workSchedule",
        label: "form.workSchedule",
        type: "enum",
        options: ["early", "late", "shift", "flexible", "normal", "other"],
        infoKey: "info.workSchedule",
      },
      {
        name: "wakeUpTime",
        label: "form.wakeUpTime",
        type: "text",
        infoKey: "info.wakeUpTime",
      },
      {
        name: "bedTime",
        label: "form.bedTime",
        type: "text",
        infoKey: "info.bedTime",
      },
      {
        name: "sleepHours",
        label: "form.sleepHours",
        type: "number",
        infoKey: "info.sleepHours",
      },
      {
        name: "goalDeadline",
        label: "form.goalDeadline",
        type: "date",
        infoKey: "info.goalDeadline",
      },
      {
        name: "notifications",
        label: "form.notifications",
        type: "boolean",
        infoKey: "info.notifications",
      },
      {
        name: "motivationLevel",
        label: "form.motivationLevel",
        type: "number",
        infoKey: "info.motivationLevel",
      },
      {
        name: "mainObstacles",
        label: "form.mainObstacles",
        type: "text",
        infoKey: "info.mainObstacles",
      },
      {
        name: "successDefinition",
        label: "form.successDefinition",
        type: "text",
        infoKey: "info.successDefinition",
      },
      {
        name: "previousFitnessExperience",
        label: "form.previousFitnessExperience",
        type: "text",
        infoKey: "info.previousFitnessExperience",
      },
      {
        name: "goal",
        label: "form.goal",
        type: "text",
        infoKey: "info.goal",
      },
    ],
  },
  {
    key: "activity",
    title: "section.activity",
    fields: [
      {
        name: "physicalActivityLevel",
        label: "form.physicalActivityLevel",
        type: "enum",
        options: ["very_low", "low", "medium", "high", "very_high", "other"],
        infoKey: "info.physicalActivityLevel",
      },
      {
        name: "stepsPerDay",
        label: "form.stepsPerDay",
        type: "number",
        infoKey: "info.stepsPerDay",
      },
      {
        name: "favoriteActivities",
        label: "form.favoriteActivities",
        type: "array",
        infoKey: "info.favoriteActivities",
      },
      {
        name: "currentSports",
        label: "form.currentSports",
        type: "array",
        infoKey: "info.currentSports",
      },
      {
        name: "newActivitiesInterest",
        label: "form.newActivitiesInterest",
        type: "array",
        infoKey: "info.newActivitiesInterest",
      },
    ],
  },
  {
    key: "sport",
    title: "section.sport",
    fields: [
      {
        name: "minutesPerWorkout",
        label: "form.minutesPerWorkout",
        type: "number",
        infoKey: "info.minutesPerWorkout",
      },
      {
        name: "workoutsPerWeek",
        label: "form.workoutsPerWeek",
        type: "number",
        infoKey: "info.workoutsPerWeek",
      },
      {
        name: "workoutLocation",
        label: "form.workoutLocation",
        type: "enum",
        options: ["home", "gym", "outdoor", "other"],
        infoKey: "info.workoutLocation",
      },
      {
        name: "equipmentAvailable",
        label: "form.equipmentAvailable",
        type: "array",
        infoKey: "info.equipmentAvailable",
      },
    ],
  },
  {
    key: "privileges",
    title: "section.privileges",
    fields: [
      {
        name: "accessLevel",
        label: "form.accessLevel",
        type: "number",
        readOnly: true,
        infoKey: "info.accessLevel",
      },
    ],
  },
];

function MyProfile() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();

  // form state
  const [fields, setFields] = useState({});
  const [initialFields, setInitialFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(sections[0].key);

  // Other value laukai (kai enum – other)
  const [otherValues, setOtherValues] = useState({});

  // Formo pradinis užkrovimas iš API
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/users")
        .then(res => res.json())
        .then(data => {
          // Adapteris masyvinėms reikšmėms
          const withArrays = { ...data };
          for (const sec of sections) {
            for (const f of sec.fields) {
              if (f.type === "array") {
                withArrays[f.name] = Array.isArray(data[f.name]) ? data[f.name] : [];
              }
            }
          }
          setFields(withArrays);
          setInitialFields(withArrays);
        });
    } else if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  // Formos laukų keitimas
  const handleChange = (field, value) => {
    setFields(prev => ({
      ...prev,
      [field]: value,
    }));
    setSuccess("");
    setError("");
  };

  // Multiinput "other" logika
  const handleOtherValue = (field, value) => {
    setOtherValues(prev => ({ ...prev, [field]: value }));
    setFields(prev => ({
      ...prev,
      [field]: "other",
      [`${field}Other`]: value,
    }));
  };

  // Ar yra pokyčių?
  const isChanged = useMemo(
    () =>
      JSON.stringify(fields, (k, v) => (v === undefined ? null : v)) !==
      JSON.stringify(initialFields, (k, v) => (v === undefined ? null : v)),
    [fields, initialFields]
  );

  // Siuntimas į serverį
  const handleSave = async () => {
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess(t("form.saveSuccess"));
      setInitialFields(fields);
    } catch (e) {
      setError(t("form.saveError") + ": " + (e.message || e));
    }
    setLoading(false);
  };

  if (status === "loading") return <div>{t("loading")}...</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 bg-white rounded-2xl shadow-lg p-6">
      <h1 className="text-3xl font-bold mb-8">{t("form.myProfile")}</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {sections.map(sec => (
          <button
            key={sec.key}
            className={`rounded-full px-4 py-2 font-medium border transition ${
              activeTab === sec.key
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100"
            }`}
            onClick={() => setActiveTab(sec.key)}
            type="button"
          >
            {t(sec.title)}
          </button>
        ))}
      </div>
      {sections.map(
        sec =>
          activeTab === sec.key && (
            <form
              key={sec.key}
              className="space-y-6"
              onSubmit={e => {
                e.preventDefault();
                if (isChanged && !loading) handleSave();
              }}
            >
              {sec.fields.map(f => {
                const val = fields[f.name] ?? "";
                // Enum 'other' valdymas
                if (f.type === "enum") {
                  return (
                    <div key={f.name} className="mb-4">
                      <label className="block mb-1 font-medium text-blue-900">
                        {t(f.label)}
                      </label>
                      <EnumSelect
                        name={f.name}
                        value={val}
                        onChange={v => {
                          if (v === "other") handleOtherValue(f.name, otherValues[f.name] || "");
                          else handleChange(f.name, v);
                        }}
                        options={f.options.filter(opt => opt !== "other")}
                        otherValue={otherValues[f.name] || ""}
                        setOtherValue={v => handleOtherValue(f.name, v)}
                        labelOther={opt => t(`enum.${f.name}.${opt}`, opt)}
                        infoKey={f.infoKey}
                      />
                    </div>
                  );
                }
                if (f.type === "array") {
                  return (
                    <div key={f.name} className="mb-4">
                      <label className="block mb-1 font-medium text-blue-900">
                        {t(f.label)}
                        <InfoTooltip infoKey={f.infoKey} />
                      </label>
                      <MultiInput
                        value={Array.isArray(val) ? val : []}
                        onChange={v => handleChange(f.name, v)}
                        placeholder={t(f.label)}
                      />
                    </div>
                  );
                }
                if (f.type === "boolean") {
                  return (
                    <div key={f.name} className="mb-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={f.name}
                        checked={!!val}
                        onChange={e => handleChange(f.name, e.target.checked)}
                        disabled={f.readOnly}
                        className="w-5 h-5"
                      />
                      <label htmlFor={f.name} className="font-medium text-blue-900">
                        {t(f.label)}
                        <InfoTooltip infoKey={f.infoKey} />
                      </label>
                    </div>
                  );
                }
                return (
                  <div key={f.name} className="mb-4">
                    <label className="block mb-1 font-medium text-blue-900">
                      {t(f.label)}
                      <InfoTooltip infoKey={f.infoKey} />
                    </label>
                    <input
                      type={f.type}
                      name={f.name}
                      value={val === null || val === undefined ? "" : val}
                      onChange={e => handleChange(f.name, e.target.value)}
                      disabled={f.readOnly}
                      className={`w-full border rounded px-3 py-2 ${
                        f.readOnly ? "bg-gray-100" : ""
                      }`}
                      placeholder={t(f.label)}
                      autoComplete="off"
                    />
                  </div>
                );
              })}
              <div className="flex items-center gap-4 mt-8">
                <button
                  type="submit"
                  className={`bg-blue-700 text-white rounded px-7 py-2 font-bold shadow transition ${
                    !isChanged || loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-800"
                  }`}
                  disabled={!isChanged || loading}
                >
                  {loading ? t("form.saving") : t("form.save")}
                </button>
                {success && (
                  <span className="text-green-700 flex items-center gap-2 ml-4">
                    <CheckCircle2 size={18} /> {success}
                  </span>
                )}
                {error && (
                  <span className="text-red-700 ml-4">{error}</span>
                )}
              </div>
            </form>
          )
      )}
    </div>
  );
}

export default MyProfile;
