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
  className="absolute -top-10 right-0 z-40 flex flex-col items-end" 
  ref={langRef}
  style={{ userSelect: 'none' }}
>
  <button
  className="bg-white border border-gray-200 px-5 py-2 rounded-tl-3xl rounded-tr-none text-blue-900 font-bold cursor-pointer flex items-center gap-2"
  style={{
    borderBottom: 'none',
    boxShadow: '0px -6px 16px -6px rgba(0,0,0,0.10)',
  }}
>
    <span>
      {router.locale?.toUpperCase() === 'EN' ? 'EN' : 'LT'}
    </span>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  {open && (
    <div className="bg-white border border-t-0 rounded-b-3xl shadow-lg mt-0 w-full">
          <button
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'en' ? 'font-bold' : ''}`}
            onClick={() => changeLanguage('en')}
            type="button"
          >
            EN
          </button>
          <button
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'lt' ? 'font-bold' : ''}`}
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
