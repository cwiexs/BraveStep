import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

export default function Navbar() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef();

  // Funkcija, kuri keičia kalbą
  const changeLanguage = (lng) => {
    router.push(router.pathname, router.asPath, { locale: lng });
    setLangOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-full flex items-center justify-end p-4">
      {/* Kalbos pasirinkimo mygtukas */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="px-3 py-1 border rounded-md hover:bg-gray-100 flex items-center gap-1"
        >
          {router.locale === 'en' ? 'EN' : 'LT'}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {langOpen && (
          <div className="absolute right-0 mt-2 w-24 bg-white rounded-md shadow-lg z-40 border">
            <button
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'en' ? 'font-bold' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'lt' ? 'font-bold' : ''}`}
              onClick={() => changeLanguage('lt')}
            >
              LT
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
