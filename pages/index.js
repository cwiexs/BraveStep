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
  const [authView, setAuthView] = useState(null); // 'signin', 'signup', null

  // Kalbos keitimas
  const changeLanguage = (lng) => {
    router.push(router.pathname, router.asPath, { locale: lng });
    setLangDropdownOpen(false);
  };

  // Home mygtukas grąžina pagrindinį vaizdą, jei authView aktyvus
  const handleGoHome = () => {
    setAuthView(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto rounded-3xl shadow-lg bg-white p-6 md:p-12 mt-8 mb-8 relative">
        {/* NAVBAR */}
        <nav className="w-full flex justify-between items-center pb-8">
          <div className="flex items-center gap-4">
            {/* LOGO */}
            <button
              onClick={handleGoHome}
              className="flex items-center focus:outline-none"
              aria-label="Go to home"
            >
              <img src="/logo.png" alt="Logo" className="w-12 h-12 mr-2" />
            </button>
            <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
              <li>
                <button onClick={handleGoHome} className="hover:text-blue-700">
                  {t('menu.home')}
                </button>
              </li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.workouts')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.nutrition')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.health')}</span></Link></li>
            </ul>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setAuthView('signin')} className="hover:text-blue-700">{t('signIn')}</button>
            <button onClick={() => setAuthView('signup')} className="hover:text-blue-700">{t('signUp')}</button>
            {/* Kalbos pasirinkimas */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="px-3 py-1 border rounded-md hover:bg-gray-100 flex items-center gap-1 ml-2"
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

        {/* MODALAS AUTH */}
        {authView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-gray-800"
                onClick={() => setAuthView(null)}
              >×</button>
              {authView === 'signin' && (
                <SignIn
                  onClose={() => setAuthView(null)}
                  onSignUp={() => setAuthView('signup')}
                />
              )}
              {authView === 'signup' && (
                <SignUp
                  onClose={() => setAuthView(null)}
                  onSignIn={() => setAuthView('signin')}
                />
              )}
            </div>
          </div>
        )}

        {/* PAGRINDINIS TURINYS */}
        {!authView && (
          <div>
            <div className="flex flex-col items-center mb-8">
              <img src="/logo.png" alt="Logo" className="w-24 h-24 mb-4" />
              <h1 className="text-4xl font-bold mb-4">{t('welcomeTitle')}</h1>
              <p className="mb-8 text-center max-w-2xl">{t('welcomeSubtitle')}</p>
            </div>
            {/* Features kortelės */}
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
