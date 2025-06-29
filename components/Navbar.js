import { useTranslation } from 'next-i18next';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useRef } from 'react';

export default function Navbar({ onHome, onSignIn, session, onLanguageChange }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef();

  return (
    <nav className="flex justify-between items-center pb-8">
      <div className="flex items-center gap-4">
        <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
          <li>
            <button onClick={onHome} className="hover:text-blue-700">
              {t('menu.home')}
            </button>
          </li>
          <li>
            <span className="hover:text-blue-700">{t('menu.workouts')}</span>
          </li>
          <li>
            <span className="hover:text-blue-700">{t('menu.nutrition')}</span>
          </li>
          <li>
            <span className="hover:text-blue-700">{t('menu.health')}</span>
          </li>
        </ul>
      </div>

      <div className="flex items-center gap-4">
        {/* Kalbos pasirinkimas */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="px-3 py-1 border rounded-md hover:bg-gray-100 flex items-center gap-1"
          >
            {router.locale?.toUpperCase() === 'EN' ? 'EN' : 'LT'}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {langDropdownOpen && (
            <div className="absolute right-0 mt-2 w-24 bg-white rounded-md shadow-lg z-50 border">
              <button
                className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'en' ? 'font-bold' : ''}`}
                onClick={() => { onLanguageChange('en'); setLangDropdownOpen(false); }}
              >
                EN
              </button>
              <button
                className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'lt' ? 'font-bold' : ''}`}
                onClick={() => { onLanguageChange('lt'); setLangDropdownOpen(false); }}
              >
                LT
              </button>
            </div>
          )}
        </div>
        {/* Prisijungimo/atsijungimo valdymas */}
        {!session ? (
          <button onClick={onSignIn} className="hover:text-blue-700">
            {t('signIn')}
          </button>
        ) : (
          <>
            <span className="font-medium text-blue-900">{t('welcome')}, {session.user?.email || 'User'}</span>
            <button onClick={() => signOut()} className="hover:text-blue-700">{t('signOut')}</button>
          </>
        )}
      </div>
    </nav>
  );
}
