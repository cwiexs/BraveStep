// pages/index.js
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import SignIn from '../components/SignIn';
import SignUp from '../components/SignUp';

export default function Home() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef(null);
  const [authModal, setAuthModal] = useState(null); // 'signin', 'signup', null

  // Kalbos keitimas
  const changeLanguage = (lng) => {
    router.push(router.pathname, router.asPath, { locale: lng });
    setLangDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto rounded-3xl shadow-lg bg-white p-6 md:p-12 mt-8 mb-8 relative">
        {/* NAVBAR */}
        <nav className="w-full flex justify-between items-center pb-8">
          <div className="flex items-center gap-4">
            <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
              <li><Link href="/"><span className="hover:text-blue-700">{t('menu.home')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.workouts')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.nutrition')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.health')}</span></Link></li>
            </ul>
            {/* SignIn/SignUp */}
            <div className="hidden md:block ml-8">
              <button onClick={() => setAuthModal('signin')} className="hover:text-blue-700 mr-2">{t('signIn')}</button>
              <button onClick={() => setAuthModal('signup')} className="hover:text-blue-700">{t('signUp')}</button>
            </div>
            {/* Kalbos dropdown */}
            <div className="flex items-center gap-4 ml-4 relative" ref={langRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="px-3 py-1 border rounded-md hover:bg-gray-100 flex items-center gap-1"
              >
                {router.locale === 'en' ? 'EN' : 'LT'}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-24 bg-white rounded-md shadow-lg z-10 border">
                  <button
                    className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'en' ? 'font-bold' : ''}`}
                    onClick={() => changeLanguage('en')}
                  >EN</button>
                  <button
                    className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'lt' ? 'font-bold' : ''}`}
                    onClick={() => changeLanguage('lt')}
                  >LT</button>
                </div>
              )}
            </div>
          </div>
        </nav>
        
        {/* KNYGOS TURINYS ARBA AUTH */}
        {authModal === 'signin' && (
          <SignIn
            onClose={() => setAuthModal(null)}
            onSignUp={() => setAuthModal('signup')}
          />
        )}
        {authModal === 'signup' && (
          <SignUp
            onClose={() => setAuthModal(null)}
            onSignIn={() => setAuthModal('signin')}
          />
        )}
        {!authModal && (
          <div>
            {/* Tavo welcome ir kiti sekcijos */}
            <h1 className="text-4xl font-bold mb-4">{t('welcomeTitle') || "Welcome!"}</h1>
            <p className="mb-8">{t('welcomeText') || "Your personalized fitness journey starts here."}</p>
            <section className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-100 rounded-xl p-6 flex flex-col items-center text-center">
                <h3 className="font-semibold text-xl mb-2">{t('features.workoutsTitle')}</h3>
                <p className="text-gray-700">{t('features.workoutsText')}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-6 flex flex-col items-center text-center">
                <h3 className="font-semibold text-xl mb-2">{t('features.mealTitle')}</h3>
                <p className="text-gray-700">{t('features.mealText')}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-6 flex flex-col items-center text-center">
                <h3 className="font-semibold text-xl mb-2">{t('features.trackTitle')}</h3>
                <p className="text-gray-700">{t('features.trackText')}</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
