import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { CheckCircle2, Info } from "lucide-react";

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xl text-gray-400 hover:text-blue-600"
          aria-label="Uždaryti"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-blue-900">{title}</h2>
        {children}
      </div>
    </div>
  );
};

// Info tooltip komponentas (suderintas su lokalizacija)
const [eatingTestModalOpen, setEatingTestModalOpen] = useState(false);

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

// ENUM select su "other" logika TIK ten, kur reikia (bet ne gender)
const EnumSelectWithOther = ({
  name, value, onChange, options, otherValue, setOtherValue, labelOther, infoKey,
}) => {
  const { t } = useTranslation();
  const isOther = !options.includes(value);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <select
          name={name}
          className="w-full border rounded px-2 py-2"
          value={isOther ? "other" : value}
          onChange={e => {
            if (e.target.value === "other") {
              onChange("");
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
        <InfoTooltip infoKey={infoKey} />
      </div>
      {/* Jei pasirinkta "other" – rodom didelį tekstinį lauką */}
      {isOther && (
          <textarea
            className="border rounded px-2 py-2 w-full min-h-[48px] max-h-40"
            value={otherValue}
            onChange={e => {
              setOtherValue(e.target.value);       // saugo į otherValues
              onChange(e.target.value);            // iš karto atnaujina ir pagrindinį field
            }}
            placeholder={t("form.enterOther") || "Enter... "}
          />
        )}


            </div>
          );
        };

// Paprastas ENUM select (be "other" logikos) — naudojamas gender
const SimpleEnumSelect = ({
  name, value, onChange, options, infoKey, labelOther,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <select
        name={name}
        className="w-full border rounded px-2 py-2"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="" disabled>
          {t("form.select")}
        </option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {labelOther ? labelOther(opt) : opt}
          </option>
        ))}
      </select>
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
        type: "select",
        options: [
          { value: "LT", label: "Lietuvių" },
          { value: "EN", label: "English" }
        ],
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
        options: ["ectomorph", "mesomorph", "endomorph", "unknown" ],
        infoKey: "info.bodyType",
        noOther: true,
      },
      {
        name: "fitnessLevel",
        label: "form.fitnessLevel",
        type: "enum",
        options: ["beginner", "intermediate", "advanced"],
        infoKey: "info.fitnessLevel",
        noOther: true,
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
        type: "text",
        infoKey: "info.healthConditions",
      },
      {
        name: "allergies",
        label: "form.allergies",
        type: "text",
        infoKey: "info.allergies",
      },
      {
        name: "foodRestrictions",
        label: "form.foodRestrictions",
        type: "text",
        infoKey: "info.foodRestrictions",
      },
      {
        name: "medications",
        label: "form.medications",
        type: "text",
        infoKey: "info.medications",
      },
      {
        name: "smokes",
        label: "form.smokes",
        type: "boolean",
        infoKey: "info.smokes",
      },
      {
  name: "alcoholUsage",
  label: "form.alcoholUsage",
  type: "select",
  options: [
    { value: "yes", label: "form.option.yes" },
    { value: "no", label: "form.option.no" }
  ],
  infoKey: "info.alcoholUsage"
},
{
  name: "alcoholAmount",
  label: "form.alcoholAmountLabel",
  type: "select",
  options: [
    { value: "light", label: "form.alcoholAmount.light" },
    { value: "moderate", label: "form.alcoholAmount.moderate" },
    { value: "heavy", label: "form.alcoholAmount.heavy" }
  ],
  visibleIf: (values) => values.alcoholUsage === "yes", 
  infoKey: "info.alcoholAmount"
},

      {
        name: "stressLevel",
        label: "form.stressLevel",
        type: "select",
        options: Array.from({ length: 10 }, (_, i) => ({
          value: (i + 1).toString(),
          label: (i + 1).toString()
        })),
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
        type: "select",
        options: Array.from({ length: 10 }, (_, i) => ({
          value: (i + 1).toString(),
          label: (i + 1).toString(),
        })),
        section: "nutrition",
        infoKey: "info.mealsPerDay"
      },
      {
        name: "eatingHabitsTest",
        label: "form.eatingHabitsTest",
        type: "customModalButton",
        infoKey: "info.eatingHabitsTest"
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
        type: "text",
        infoKey: "info.favoriteFoods",
      },
      {
        name: "dislikedFoods",
        label: "form.dislikedFoods",
        type: "text",
        infoKey: "info.dislikedFoods",
      },
      {
        name: "cuisinePreference",
        label: "form.cuisinePreference",
        type: "text",
        infoKey: "info.cuisinePreference",
      },
      {
        name: "supplements",
        label: "form.supplements",
        type: "text",
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

// ———— KOMPONENTAS ————
function MyProfile() {
  const [bodyTypeModalOpen, setBodyTypeModalOpen] = useState(false);
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

  // "other" values laukai (kai enum – other)
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
              if (f.type === "array" && Array.isArray(data[f.name])) {
              }
            }
          }
          setFields(withArrays);
          setInitialFields(withArrays);
          // Užpildyk otherValues, jeigu kažkur yra netiesioginis tekstas:
          const initOther = {};
          for (const sec of sections) {
            for (const f of sec.fields) {
              if (
                f.type === "enum" &&
                f.name !== "gender" &&
                withArrays[f.name] &&
                !f.options.includes(withArrays[f.name])
              ) {
                initOther[f.name] = withArrays[f.name];
              }
            }
          }
          setOtherValues(initOther);
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

  };

const finalData = {
  ...fields,
  ...Object.keys(otherValues).reduce((acc, key) => {
    const fieldDef = sections
      .flatMap(s => s.fields)
      .find(f => f.name === key);
    
    if (fieldDef && fieldDef.options && !fieldDef.options.includes(fields[key])) {
      acc[key] = otherValues[key];
    }

    return acc;
  }, {})
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
        body: JSON.stringify(finalData),
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
      <h1 className="text-blue-900 font-medium flex justify-center hover:text-blue-700 rounded px-4 py-2 text-3xl transition mb-10">{t("form.myProfile")}</h1>
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
                // Jei yra visibleIf ir ji grąžina false — nerodom šio lauko
                if (f.visibleIf && !f.visibleIf(fields)) return null;
                // Gender — paprastas select be "other"
                if (f.type === "enum" && f.name === "gender") {
                  return (
                    <div key={f.name} className="mb-4">
                      <label className="block mb-1 font-medium text-blue-900">
                        {t(f.label)}
                      </label>
                      <SimpleEnumSelect
                        name={f.name}
                        value={val}
                        onChange={v => handleChange(f.name, v)}
                        options={f.options}
                        labelOther={opt => t(`enum.${f.name}.${opt}`, opt)}
                        infoKey={f.infoKey}
                      />
                    </div>
                  );
                }
                // Kiti enumai — su "other"
                if (f.type === "enum") {
  const isSimple = f.name === "gender" || f.noOther;
  return (
    <div key={f.name} className="mb-4">
      <label className="block mb-1 font-medium text-blue-900">
        {t(f.label)}
      </label>
      {isSimple ? (
        <SimpleEnumSelect
          name={f.name}
          value={val}
          onChange={v => handleChange(f.name, v)}
          options={f.options}
          labelOther={opt => t(`enum.${f.name}.${opt}`, opt)}
          infoKey={f.infoKey}
        />
      ) : (
        <EnumSelectWithOther
          name={f.name}
          value={val}
          onChange={v => {
            if (v === "") {
              handleChange(f.name, otherValues[f.name] || "");
            } else {
              handleChange(f.name, v);
            }
          }}
          options={f.options.filter(opt => opt !== "other")}
          otherValue={otherValues[f.name] || ""}
          setOtherValue={v => handleOtherValue(f.name, v)}
          labelOther={opt => t(`enum.${f.name}.${opt}`, opt)}
          infoKey={f.infoKey}
        />
      )}
      {/* PAPILDOMA: */}
      {f.name === "bodyType" && val === "unknown" && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setBodyTypeModalOpen(true)}
            className="bg-blue-100 text-blue-900 rounded px-4 py-2 font-medium hover:bg-blue-200 transition"
          >
            {t("wantToKnow")}
          </button>
        </div>
      )}
      <Modal
        open={bodyTypeModalOpen}
        onClose={() => setBodyTypeModalOpen(false)}
        title={t("bodyTypeDescriptionsTitle")}
      >
        <div className="space-y-4">
          <div>
            <b>{t("enum.bodyType.ectomorph")}:</b>
            <span className="ml-2">{t("bodyTypeInfo.ectomorph")}</span>
          </div>
          <div>
            <b>{t("enum.bodyType.mesomorph")}:</b>
            <span className="ml-2">{t("bodyTypeInfo.mesomorph")}</span>
          </div>
          <div>
            <b>{t("enum.bodyType.endomorph")}:</b>
            <span className="ml-2">{t("bodyTypeInfo.endomorph")}</span>
          </div>
        </div>
      </Modal>
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
    <div key={f.name} className="mb-4">
      <label className="block mb-1 font-medium text-blue-900">
        {t(f.label)}
        <InfoTooltip infoKey={f.infoKey} />
      </label>
      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={f.name}
            value="true"
            checked={val === true}
            onChange={() => handleChange(f.name, true)}
          />
          {t("form.yes")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={f.name}
            value="false"
            checked={val === false}
            onChange={() => handleChange(f.name, false)}
          />
          {t("form.no")}
        </label>
      </div>
    </div>
  );
}

                if (f.type === "select") {
                  return (
                    <div key={f.name} className="mb-4">
                      <label className="block mb-1 font-medium text-blue-900">
                        {t(f.label)}
                        <InfoTooltip infoKey={f.infoKey} />
                      </label>
                      <select
                        name={f.name}
                        value={val}
                        onChange={e => handleChange(f.name, e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="" disabled>
                          {t("form.select")}
                        </option>
                        {f.options.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {t(opt.label)}
                          </option>
                        ))}
                      </select>
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
                      value={
                        f.type === "date" && typeof val === "string" && val.length >= 10
                          ? val.slice(0, 10)
                          : val === null || val === undefined
                            ? ""
                            : val
                      }
                      onChange={e => handleChange(f.name, e.target.value)}
                      disabled={f.readOnly}
                      className={`w-full border rounded px-3 py-2 ${f.readOnly ? "bg-gray-100" : ""}`}
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
if (f.type === "customModalButton") {
  return (
    <div key={f.name} className="mb-4">
      <label className="block mb-1 font-medium text-blue-900">
        {t(f.label)}
        <InfoTooltip infoKey={f.infoKey} />
      </label>
      <button
        type="button"
        onClick={() => setEatingTestModalOpen(true)}
        className="bg-blue-100 text-blue-900 rounded px-4 py-2 font-medium hover:bg-blue-200 transition"
      >
        {t("form.startTest")}
      </button>
      <Modal
        open={eatingTestModalOpen}
        onClose={() => setEatingTestModalOpen(false)}
        title={t("form.eatingHabitsTestTitle")}
      >
        <div className="space-y-4">
          <p>{t("form.eatingHabitsTestDescription")}</p>
          {/* Čia bus testas – kol kas tik placeholder */}
        </div>
      </Modal>
    </div>
  );
}

export default MyProfile;