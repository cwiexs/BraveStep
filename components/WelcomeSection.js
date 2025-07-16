import { useTranslation } from 'next-i18next';
import Image from 'next/image';

export default function WelcomeSection({ onSignIn, onSignUp }) {
  const { t } = useTranslation('common');

  return (
    <header className="flex flex-col md:flex-row items-center justify-between py-8 px-2">
      {/* Kairėje – tekstinė dalis su išverčiamais šūkiais */}
      <div className="flex-1 mb-10 md:mb-0 flex flex-col items-start md:items-center md:text-left">
        {/* Didelė antraštė "WELCOME!" */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-blue-900 uppercase">
          {t('welcomeTitle')}
        </h1>

        {/* Po antrašte – motyvaciniai sakiniai */}
        <p className="text-gray-800 text-xl mb-2">
          {t('welcomeStepTaken')}
        </p>
        <p className="text-gray-600 mb-6 text-lg">
          {t('welcomeBalanceBegins')}
        </p>

        {/* Mygtukas pradėti kelionę */}
        <div className="flex gap-4">
          <button
            className="border border-[#245A6B] text-[#245A6B] py-3 px-7 rounded-lg font-semibold text-lg shadow-md hover:bg-[#245A6B] hover:text-white transition-colors"
            onClick={onSignUp}
          >
            {t('startYourJourney')}
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