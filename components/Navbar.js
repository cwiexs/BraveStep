import { useTranslation } from 'next-i18next';
import { signOut } from 'next-auth/react';

export default function Navbar({ onHome, onSignIn, session, onMyProfile }) {
  const { t } = useTranslation('common');

  return (
    <nav className="flex justify-between items-center pb-8">
      <div className="flex items-center gap-4">
        <ul className=" gap-8 text-blue-900 font-medium">
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
          {session && (
            <li>
              <button
                onClick={onMyProfile}
                className="hover:text-blue-700"
                type="button"
              >
                {t('menu.myProfile')}
              </button>
            </li>
          )}
        </ul>
      </div>
      <div className="flex items-center gap-4">
        {/* Prisijungimo/atsijungimo valdymas */}
        {!session ? (
          <button onClick={onSignIn} className="text-blue-900 font-medium hover:text-blue-700 rounded py-2">
            {t('menu.signIn')}
          </button>
        ) : (
          <button onClick={() => signOut()} className="text-blue-900 font-medium hover:text-blue-700 rounded py-2">{t('menu.signOut')}</button>
        )}
      </div>
    </nav>
  );
}
