import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

export default function Home() {
  const { t } = useTranslation('common');
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef();
  const router = useRouter();

  const changeLanguage = (lng) => {
    router.push(router.pathname, router.asPath, { locale: lng });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <Head>
        <title>BraveStep</title>
      </Head>

      {/* KNYGOS LAPO STILIUS */}
      <div className="max-w-5xl mx-auto rounded-3xl shadow-lg bg-white p-6 md:p-12 mt-8 mb-8">
        {/* NAVBAR */}
        <nav className="w-full flex justify-between items-center pb-8">
          <span className="font-bold text-2xl text-blue-900">BraveStep</span>
          <div className="flex items-center gap-4">
            <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
              <li><Link href="/"><span className="hover:text-blue-700">{t('menu.home')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.workouts')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.nutrition')}</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">{t('menu.health')}</span></Link></li>
            </ul>
            {/* Kalbos pasirinkimo dropdown */}
            <div className="relative" ref={langRef}>
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
                    onClick={() => { changeLanguage('en'); setLangDropdownOpen(false); }}
                  >
                    EN
                  </button>
                  <button
                    className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${router.locale === 'lt' ? 'font-bold' : ''}`}
                    onClick={() => { changeLanguage('lt'); setLangDropdownOpen(false); }}
                  >
                    LT
                  </button>
                </div>
              )}
            </div>
            <div className="hidden md:block">
              {session ? (
                <button onClick={() => signOut()} className="hover:text-blue-700">{t('signOut')}</button>
              ) : (
                <button onClick={() => signIn()} className="hover:text-blue-700">{t('signIn')}</button>
              )}
            </div>
            {/* Hamburger */}
            <button
              className="md:hidden focus:outline-none"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="text-3xl">☰</span>
            </button>
          </div>
        </nav>
        {/* Mobile overlay meniu */}
        {menuOpen && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-50 transition-all">
            <button
              className="absolute top-6 right-6 text-3xl"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >×</button>
            <ul className="flex flex-col gap-10 text-2xl font-semibold">
              <li onClick={() => setMenuOpen(false)}><Link href="/">{t('menu.home')}</Link></li>
              <li onClick={() => setMenuOpen(false)}><Link href="#">{t('menu.workouts')}</Link></li>
              <li onClick={() => setMenuOpen(false)}><Link href="#">{t('menu.nutrition')}</Link></li>
              <li onClick={() => setMenuOpen(false)}><Link href="#">{t('menu.health')}</Link></li>
              <li>
                {session ? (
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="hover:text-blue-700"
                  >{t('signOut')}</button>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); signIn(); }}
                    className="hover:text-blue-700"
                  >{t('signIn')}</button>
                )}
              </li>
              <li className="flex gap-2 justify-center">
                <button onClick={() => { changeLanguage('en'); setMenuOpen(false); }} className={`px-2 ${router.locale === 'en' ? 'font-bold underline' : ''}`}>EN</button>
                <button onClick={() => { changeLanguage('lt'); setMenuOpen(false); }} className={`px-2 ${router.locale === 'lt' ? 'font-bold underline' : ''}`}>LT</button>
              </li>
            </ul>
          </div>
        )}

        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between py-8 px-2">
          {/* Left side: Text */}
          <div className="flex-1 mb-10 md:mb-0 flex flex-col items-start md:items-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-blue-900">
              {t('welcomeTitle')}
            </h1>
            <p className="text-gray-600 mb-7 text-lg">
              {t('welcomeSubtitle')}
            </p>
            <button className="bg-[#245A6B] hover:bg-[#1a4351] text-white py-3 px-7 rounded-lg font-semibold text-lg shadow-md">
              {t('getStarted')}
            </button>
          </div>
          {/* Right side: Illustration */}
          <div className="flex-1 flex justify-center">
            <Image
              src="/hero.png"
              alt="Wellness person"
              width={300}
              height={300}
              priority
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </header>

        {/* FEATURES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-7 pb-4 px-2">
          {/* Feature 1 */}
          <div className="bg-[#F6F8F7] border border-[#E7E7E7] rounded-xl shadow-sm flex flex-col items-center p-7 min-h-[200px]">
            <div className="text-4xl mb-4 text-[#75BFA2]">✅</div>
            <h3 className="font-bold text-lg mb-2 text-blue-900">{t('features.workoutsTitle')}</h3>
            <p className="text-gray-600 text-center">{t('features.workoutsText')}</p>
          </div>
          {/* Feature 2 */}
          <div className="bg-[#F6F8F7] border border-[#E7E7E7] rounded-xl shadow-sm flex flex-col items-center p-7 min-h-[200px]">
            <div className="text-4xl mb-4 text-[#75BFA2]">🍏</div>
            <h3 className="font-bold text-lg mb-2 text-blue-900">{t('features.mealTitle')}</h3>
            <p className="text-gray-600 text-center">{t('features.mealText')}</p>
          </div>
          {/* Feature 3 */}
          <div className="bg-[#F6F8F7] border border-[#E7E7E7] rounded-xl shadow-sm flex flex-col items-center p-7 min-h-[200px]">
            <div className="text-4xl mb-4 text-[#75BFA2]">📊</div>
            <h3 className="font-bold text-lg mb-2 text-blue-900">{t('features.trackTitle')}</h3>
            <p className="text-gray-600 text-center">{t('features.trackText')}</p>
          </div>
        </section>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen w-full bg-[#E6F4EA]"> {/* Šviesiai žalias fonas! */}
      <Head>...</Head>
      {/* Viduje tavo kortelė */}
      <div className="max-w-5xl mx-auto rounded-3xl shadow-lg bg-white p-6 md:p-12 mt-8 mb-8">
         {/* ... turinys */}
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
