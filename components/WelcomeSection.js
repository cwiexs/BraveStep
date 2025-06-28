import { useTranslation } from 'next-i18next';
import Image from 'next/image';

export default function WelcomeSection({ onSignIn, onSignUp }) {
  const { t } = useTranslation('common');
  return (
    <header className="flex flex-col md:flex-row items-center justify-between py-8 px-2">
      {/* Kairėje – tekstas */}
      <div className="flex-1 mb-10 md:mb-0 flex flex-col items-start md:items-center md:text-left">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-blue-900">{t('welcomeTitle')}</h1>
        <p className="text-gray-600 mb-7 text-lg">{t('welcomeSubtitle')}</p>
        <div className="flex gap-4">
          <button
            className="bg-[#245A6B] hover:bg-[#1a4351] text-white py-3 px-7 rounded-lg font-semibold text-lg shadow-md"
            onClick={onSignIn}
          >
            {t('getStarted')}
          </button>
          <button
            className="border border-[#245A6B] text-[#245A6B] py-3 px-7 rounded-lg font-semibold text-lg shadow-md"
            onClick={onSignUp}
          >
            {t('signUp')}
          </button>
        </div>
      </div>
      {/* Dešinėje – iliustracija */}
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
  );
}
