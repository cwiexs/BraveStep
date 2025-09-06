// components/LanguageTab.js
import { useRouter } from 'next/router';
import { useRef, useState, useEffect } from 'react';

export default function LanguageTab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const langRef = useRef(null);

  // uždarom dropdown paspaudus už ribų
  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const persistLocale = (lng) => {
    try { document.cookie = `NEXT_LOCALE=${lng}; path=/`; } catch {}
    try { localStorage.setItem('user_locale', lng); } catch {}
  };

  const changeLanguage = async (lng) => {
    const next = String(lng || '').trim().toLowerCase();
    if (!next || next === router.locale) { setOpen(false); return; }

    // Perjungiam Next maršrutizatoriaus locale (be pilno reload)
    await router.replace(router.asPath, undefined, { locale: next, scroll: false });

    // Persistinam pasirinkimą
    persistLocale(next);
    setOpen(false);
  };

  const locales = router.locales && router.locales.length ? router.locales : ['en', 'lt'];
  const current = (router.locale || 'en').toUpperCase();

  return (
    <div
      className="absolute top-2 right-2 z-40 flex flex-col items-end"
      ref={langRef}
      style={{ userSelect: 'none' }}
    >
      <button
        className="backdrop-blur bg-white/70 hover:bg-white/90 px-4 py-1 rounded-full text-blue-900 font-normal text-xs cursor-pointer flex items-center gap-2 transition"
        style={{ border: 'none', boxShadow: 'none' }}
        onClick={() => setOpen((x) => !x)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
        aria-label="Change language"
      >
        <span className="uppercase tracking-wider">{current}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="mt-2 bg-white shadow-lg rounded-xl overflow-hidden min-w-[120px] border border-gray-200 animate-fade-in"
          role="listbox"
        >
          {locales.map((lng) => {
            const isActive = router.locale === lng;
            return (
              <button
                key={lng}
                className={`block w-full text-left px-4 py-2 hover:bg-blue-50 ${isActive ? 'font-bold' : ''}`}
                onClick={() => changeLanguage(lng)}
                type="button"
                role="option"
                aria-selected={isActive ? 'true' : 'false'}
              >
                {lng.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
