import { useTranslation } from 'next-i18next';
import { signIn, signOut } from 'next-auth/react';

export default function Navbar({ onHome, onSignIn, onSignUp, session }) {
  const { t } = useTranslation('common');

  return (
    <nav className="flex justify-between items-center pb-8">
      <div className="flex items-center gap-4">
        <ul className="hidden md:flex gap-8 text-blue-900 font-medium">
          <li><button onClick={onHome} className="hover:text-blue-700">{t('menu.home')}</button></li>
          <li><span className="hover:text-blue-700">{t('menu.workouts')}</span></li>
          <li><span className="hover:text-blue-700">{t('menu.nutrition')}</span></li>
          <li><span className="hover:text-blue-700">{t('menu.health')}</span></li>
        </ul>
      </div>
      <div className="flex items-center gap-4">
        {!session ? (
          <>
            <button onClick={onSignIn} className="hover:text-blue-700">{t('signIn')}</button>
            <button onClick={onSignUp} className="hover:text-blue-700">{t('signUp')}</button>
          </>
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
