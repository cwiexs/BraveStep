import { useTranslation } from 'next-i18next';
import Image from 'next/image';

export default function WelcomeSection({ onSignIn, onSignUp }) {
  const { t } = useTranslation('common');

  return (
    <header className="flex flex-col md:flex-row items-center justify-between py-12 px-6 bg-transparent rounded-xl">
      {/* Kairėje – tekstinė dalis */}
      <div className="flex-1 mb-10 md:mb-0 flex flex-col items-start md:items-start text-left">
        <h1 className="text-5xl font-extrabold text-blue-900 tracking-wide mb-4">
          {t('welcomeTitle')}
        </h1>

        <p className="text-blue-900 text-2xl mb-3 font-medium">
          {t('welcomeStepTaken')}
        </p>
        <p className="text-blue-900 text-lg mb-6">
          {t('welcomeBalanceBegins')}
        </p>

        <button
          className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-semibold text-lg transition-all shadow-md hover:scale-105"
          onClick={onSignUp}
        >
          {t('startYourJourney')}
        </button>
      </div>

      {/* Iliustracija – dešinėje */}
      <div className="flex-1 flex justify-center">
        <Image
          src="/hero.png"
          alt="Person celebrating wellness"
          width={300}
          height={300}
          priority
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </header>

  );
}