import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";

//
// *** FormField komponentas (viršuje, NE inline) ***
//
function FormField({ label, type = "text", value, onChange, disabled }) {
  return (
    <div className="mb-3 flex gap-2 items-center">
      <label className="w-32">{label}</label>
      <input
        type={type}
        className="w-full p-2 border rounded"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

//
// *** MyProfile pagrindinis komponentas ***
//
export default function MyProfile() {
  console.log(
    "%c[MyProfile RENDER]",
    "color: green; font-weight: bold;",
    new Date().toLocaleTimeString()
  );
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation("common");
  const [form, setForm] = useState({
    name: "",
    email: "",
    goal: "",
    phone: "",
    dateOfBirth: "",
    city: "",
  });
  const [originalForm, setOriginalForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // REDIRECT jei neprisijungęs
  useEffect(() => {
    if (status === "unauthenticated") {
      console.log(
        "%c[REDIRECT to SIGNIN]",
        "color: orange; font-weight: bold;",
        new Date().toLocaleTimeString()
      );
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  // Užkrauk duomenis tik kartą (arba kai prisijungi)
  useEffect(() => {
    console.log(
      "%c[useEffect] status:",
      "color: blue;",
      status,
      new Date().toLocaleTimeString()
    );
    if (status === "authenticated") {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          const profile = {
            name: data.name || "",
            email: data.email || "",
            goal: data.goal || "",
            phone: data.phone || "",
            dateOfBirth: data.dateOfBirth
              ? data.dateOfBirth.substring(0, 10)
              : "",
            city: data.city || "",
          };
          setForm(profile);
          setOriginalForm(profile);
          console.log(
            "%c[DATA LOADED from API]",
            "color: purple;",
            profile,
            new Date().toLocaleTimeString()
          );
        });
    }
  }, [status]);

  function isFormChanged() {
    return (
      !!originalForm &&
      Object.keys(form).some((key) => form[key] !== originalForm[key])
    );
  }

  async function handleSave() {
    setIsSaving(true);
    // Paruošk tik pakeistus laukus
    const fieldsToUpdate = {};
    Object.keys(form).forEach((key) => {
      if (form[key] !== originalForm[key]) {
        fieldsToUpdate[key] = form[key];
      }
    });
    console.log(
      "%c[SAVE BUTTON CLICKED] Fields to update:",
      "color: teal;",
      fieldsToUpdate,
      new Date().toLocaleTimeString()
    );
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fieldsToUpdate),
      });
      if (res.ok) {
        setOriginalForm(form);
        console.log(
          "%c[SAVE SUCCESS]",
          "color: green;",
          new Date().toLocaleTimeString()
        );
      } else {
        alert(t("saveError") || "Klaida išsaugant duomenis!");
        console.log(
          "%c[SAVE FAILED - RES NOT OK]",
          "color: red;",
          new Date().toLocaleTimeString()
        );
      }
    } catch (e) {
      alert(t("saveError") || "Klaida išsaugant duomenis!");
      console.log(
        "%c[SAVE FAILED - EXCEPTION]",
        "color: red;",
        new Date().toLocaleTimeString()
      );
    }
    setIsSaving(false);
  }

  function handleFieldChange(field, value) {
    console.log(
      "%c[INPUT CHANGE]",
      "color: #a0522d;",
      field,
      "->",
      value,
      new Date().toLocaleTimeString()
    );
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  if (status === "loading") return null;

  return (
    <form
      className="max-w-sm ml-0 p-4 bg-white rounded shadow"
      onSubmit={(e) => {
        e.preventDefault();
        console.log(
          "%c[FORM SUBMIT]",
          "color: navy;",
          "isFormChanged:",
          isFormChanged(),
          new Date().toLocaleTimeString()
        );
        if (isFormChanged()) handleSave();
      }}
    >
      <h2 className="text-blue-900 font-medium mb-4">{t("myProfile")}</h2>
      <FormField
        label={t("name")}
        value={form.name}
        onChange={(val) => handleFieldChange("name", val)}
      />
      <FormField
        label={t("email")}
        value={form.email}
        type="email"
        onChange={() => {}}
        disabled={true}
      />
      <FormField
        label={t("goal")}
        value={form.goal}
        onChange={(val) => handleFieldChange("goal", val)}
      />
      <FormField
        label={t("phone")}
        value={form.phone}
        onChange={(val) => handleFieldChange("phone", val)}
      />
      <FormField
        label={t("dateOfBirth")}
        value={form.dateOfBirth}
        type="date"
        onChange={(val) => handleFieldChange("dateOfBirth", val)}
      />
      <FormField
        label={t("city")}
        value={form.city}
        onChange={(val) => handleFieldChange("city", val)}
      />
      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          className={`bg-blue-700 text-white rounded px-6 py-2 font-semibold transition ${
            !isFormChanged() || isSaving ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isFormChanged() || isSaving}
        >
          {isSaving ? t("loading") || "Išsaugojama..." : t("save") || "Išsaugoti"}
        </button>
      </div>
    </form>
  );
}
