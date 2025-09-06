// components/LocaleBootstrapper.jsx
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

function normalizeLocale(v) {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();
  if (["lt","en","pl","ru","de"].includes(s)) return s;
  if (s.includes("liet")) return "lt";
  if (s.includes("eng")) return "en";
  if (s.startsWith("pl") || s.includes("pol")) return "pl";
  if (s.startsWith("ru") || s.includes("rus")) return "ru";
  if (s.startsWith("de") || s.includes("ger") || s.includes("deut")) return "de";
  return null;
}

export default function LocaleBootstrapper() {
  const { data } = useSession();
  const router = useRouter();

  // 1) Po prisijungimo – imame iš session.user.locale
  useEffect(() => {
    const desiredRaw = data?.user?.locale;
    const desired = normalizeLocale(desiredRaw);
    if (!desired) return;

    // Jei jau esame norimoje kalboje – nieko nedarom
    if (router.locale === desired) return;

    // Perjungiame Next maršrutizatorių į kitą locale (be perkrolinimo)
    router.replace(router.asPath, undefined, { locale: desired, scroll: false });

    // Persistinam
    try { document.cookie = `NEXT_LOCALE=${desired}; path=/`; } catch {}
    try { localStorage.setItem("user_locale", desired); } catch {}
  }, [data?.user?.locale, router]);

  // 2) Anonimams – iš localStorage
  useEffect(() => {
    const raw = (typeof window !== "undefined") ? localStorage.getItem("user_locale") : null;
    const pref = normalizeLocale(raw);
    if (!pref) return;
    if (router.locale === pref) return;

    router.replace(router.asPath, undefined, { locale: pref, scroll: false });
    try { document.cookie = `NEXT_LOCALE=${pref}; path=/`; } catch {}
  }, [router]);

  return null;
}
