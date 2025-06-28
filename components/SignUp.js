// components/SignUp.js
import { useState } from 'react';
import { useTranslation } from 'next-i18next';

export default function SignUp({ onClose, onSignIn }) {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== password2) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    // signup logika
    alert(t('signUp') + ': ' + email);
    onClose(); // Po registracijos gali uždaryti modalą arba palikti atidarytą
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-semibold mb-4">{t('signUp')}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="email"
          className="border rounded px-3 py-2"
          placeholder={t('email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            placeholder={t('password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm"
            onClick={() => setShowPass(!showPass)}
            tabIndex={-1}
          >
            {showPass ? t('hide') : t('show')}
          </button>
        </div>
        <div className="relative">
          <input
            type={showPass2 ? "text" : "password"}
            className="border rounded px-3 py-2 w-full"
            placeholder={t('confirmPassword')}
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-2 text-sm"
            onClick={() => setShowPass2(!showPass2)}
            tabIndex={-1}
          >
            {showPass2 ? t('hide') : t('show')}
          </button>
        </div>
        {error && <div className="text-red-600 text-xs">{error}</div>}
        <button type="submit" className="bg-blue-700 text-white rounded py-2">{t('signUp')}</button>
      </form>
      <div className="mt-4 text-sm">
        {t('alreadyHaveAccount')}{' '}
        <button className="text-blue-700 underline" onClick={onSignIn}>{t('signIn')}</button>
      </div>
      <button onClick={onClose} className="mt-6 text-xs text-gray-500 hover:underline">
        {t('hide')}
      </button>
    </div>
  );
}
