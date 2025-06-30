import { useRouter } from 'next/router';
import { useRef, useState, useEffect } from 'react';

export default function LanguageTab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const langRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const changeLanguage = (lng) => {
    router.push(router.pathname, router.asPath, { locale: lng });
    setOpen(false);
  };

  return (
    <div
      className="absolute top-4 right-8 z-40 flex flex-col items-end"
      ref={langRef}
      style={{ userSelect: 'none' }}
    >
      <button
        className="backdrop-blur bg-white/70 hover:bg-white/90 px-5 py-2 rounded-full text-blue-900 font-bold cursor-pointer flex items-center gap-2 shadow-md transition"
        style={{
          border: 'none',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)'
        }}
        onClick={() => setOpen(x => !x)}
        type="button"
      >
        <span className="uppercase tracking-wider">{router.locale?.toUpperCase() === 'EN' ? 'EN' : 'LT'}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 bg-white shadow-lg rounded-xl overflow-hidden min-w-[96px] border border-gray-200 animate-fade-in">
          <button
            className={`block w-full text-left px-4 py-2 hover:bg-blue-50 ${router.locale === 'en' ? 'font-bold' : ''}`}
            onClick={() => changeLanguage('en')}
            type="button"
          >
            EN
          </button>
          <button
            className={`block w-full text-left px-4 py-2 hover:bg-blue-50 ${router.locale === 'lt' ? 'font-bold' : ''}`}
            onClick={() => changeLanguage('lt')}
            type="button"
          >
            LT
          </button>
        </div>
      )}
    </div>
  );
}
