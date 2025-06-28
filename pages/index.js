import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { signIn, signOut, useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef(null);

  // Keičia kalbą ir uždaro dropdown
  function changeLanguage(lang) {
    if (router.locale !== lang) {
      router.push(router.pathname, router.asPath, { locale: lang });
    }
  }

  // Uždarome dropdown paspaudus ne ant jo
  // (tavo originali logika, jei naudojai – gali pasilikti arba praleisti)
  // useEffect(() => { ... });

  return (
    <div className="min-h-screen w-full bg-[#E6F4EA]">
      <Head>
        <title>BraveStep</title>
      </Head>

      {/* Baltas „knygos lapas“ */}
      <div className="max-w-5xl mx-auto rounded-3xl shadow-lg bg-white p-6 md:p-12 mt-8 mb-8 relative">

        {/* KALBOS PASIRINKIMO DROPDOWN – VIRŠ SIGN IN, KORTELES KAMPE */}
        <div className="absolute top-4 right-8 z-30">
          <div className="flex items-center" ref={langRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-3 py-1 border rounded-md hover:bg-gray-100 flex items-center gap-1 text-sm"
              style={{ minWidth: '48px' }}
            >
              {router.locale === 'en' ? 'EN' : 'LT'}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-24 bg-white rounded-md shadow-lg z-40 border">
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
        </div>

        {/* NAVBAR be kalbų pasirinkimo */}
        <nav className="w-full flex justify-between items-center pb-8">
          <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
            <li><Link href="/"><span className="hover:text-blue-700">{t('menu.home')}</span></Link></li>
            <li><Link href="#"><span className="hover:text-blue-700">{t('menu.workouts')}</span></Link></li>
            <li><Link href="#"><span className="hover:text-blue-700">{t('menu.nutrition')}</span></Link></li>
            <li><Link href="#"><span className="hover:text-blue-700">{t('menu.health')}</span></Link></li>
          </ul>
          <div className="flex items-center gap-4 ml-auto">
            {/* SignIn/SignOut */}
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

        {/* MOBILE OVERLAY MENIU */}
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

        {/* TOLIAU EINA TAVO TURINYS */}
        {/* Header/hero sekcija */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-900">{t('hero.title')}</h1>
          <p className="text-lg md:text-xl text-gray-600">{t('hero.subtitle')}</p>
        </header>

        {/* Features ar kitas turinys */}
        <section className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#E6F4EA] rounded-xl p-6 text-center shadow">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{t('features.workoutsTitle')}</h2>
            <p className="text-gray-700">{t('features.workoutsDesc')}</p>
          </div>
          <div className="bg-[#E6F4EA] rounded-xl p-6 text-center shadow">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{t('features.nutritionTitle')}</h2>
            <p className="text-gray-700">{t('features.nutritionDesc')}</p>
          </div>
          <div className="bg-[#E6F4EA] rounded-xl p-6 text-center shadow">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{t('features.healthTitle')}</h2>
            <p className="text-gray-700">{t('features.healthDesc')}</p>
          </div>
        </section>

        {/* Galima tęsti su kitais blokais, pvz. apie programą, atsiliepimais ir t.t. */}

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
