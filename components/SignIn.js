// components/SignIn.js
import { useState } from 'react';
import { useTranslation } from 'next-i18next';

export default function SignIn({ onClose, onSignUp }) {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Čia login logika
    alert(t('signIn') + ': ' + email);
    onClose();
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[350px]">
      <h2 className="text-2xl font-semibold mb-4">{t('signIn')}</h2>
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
        <button type="submit" className="bg-blue-700 text-white rounded py-2">{t('signIn')}</button>
      </form>
      <div className="mt-4 text-sm">
        {t('dontHaveAccount')}{' '}
        <button className="text-blue-700 underline" onClick={onSignUp}>{t('signUp')}</button>
      </div>
      <button onClick={onClose} className="mt-6 text-xs text-gray-500 hover:underline">
        {t('hide')}
      </button>
    </div>
  );
}
