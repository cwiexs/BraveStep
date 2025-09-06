import { useEffect } from "react";
import { useTranslation } from "next-i18next";
import { useSession } from "next-auth/react";

function normalizeLocale(v) {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();

  // tikslios reikšmės
  if (["lt", "en", "pl", "ru", "de"].includes(s)) return s;

  // žodžiai / sinonimai
  if (s.includes("liet")) return "lt";       // Lietuvių, lietuviskai, etc.
  if (s.includes("eng") || s === "english") return "en";
  if (s.startsWith("pl") || s.includes("pol")) return "pl";
  if (s.startsWith("ru") || s.includes("rus")) return "ru";
  if (s.startsWith("de") || s.includes("ger") || s.includes("deut")) return "de";

  return null;
}

export default function LocaleBootstrapper() {
  const { i18n } = useTranslation();
  const { data } = useSession();

  const desiredRaw = data?.user?.locale;
  const desired = normalizeLocale(desiredRaw);

  // Po prisijungimo – iš sesijos
  useEffect(() => {
    if (!desired) return;
    if (i18n.language !== desired) {
      i18n.changeLanguage(desired);
      try { document.cookie = `NEXT_LOCALE=${desired}; path=/`; } catch {}
      try { localStorage.setItem("user_locale", desired); } catch {}
    }
  }, [desired, i18n]);

  // Anonimams – iš localStorage (irgi normalizuojam)
  useEffect(() => {
    const raw = (typeof window !== "undefined") ? localStorage.getItem("user_locale") : null;
    const pref = normalizeLocale(raw);
    if (pref && i18n.language !== pref) {
      i18n.changeLanguage(pref);
      try { document.cookie = `NEXT_LOCALE=${pref}; path=/`; } catch {}
    }
  }, [i18n]);

  return null;
}
