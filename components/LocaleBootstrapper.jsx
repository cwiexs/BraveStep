
import { useEffect } from "react";
import { useTranslation } from "next-i18next";
import { useSession } from "next-auth/react";

/**
 * Client bootstrap: once user logs in, switch next-i18next language
 * to user's preference and persist in NEXT_LOCALE + localStorage.
 * Also respects localStorage language for anonymous visitors.
 */
export default function LocaleBootstrapper() {
  const { i18n } = useTranslation();
  const { data } = useSession();
  const desired = data?.user?.locale;

  useEffect(() => {
    if (!desired) return;
    if (i18n.language !== desired) {
      i18n.changeLanguage(desired);
      try { document.cookie = `NEXT_LOCALE=${desired}; path=/`; } catch {}
      try { localStorage.setItem("user_locale", desired); } catch {}
    }
  }, [desired, i18n]);

  useEffect(() => {
    const pref = (typeof window !== "undefined") ? localStorage.getItem("user_locale") : null;
    if (pref && i18n.language !== pref) {
      i18n.changeLanguage(pref);
      try { document.cookie = `NEXT_LOCALE=${pref}; path=/`; } catch {}
    }
  }, [i18n]);

  return null;
}
