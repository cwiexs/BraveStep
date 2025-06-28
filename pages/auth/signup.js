import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const { t } = useTranslation('common');

  const passwordsMatch = password === confirm;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!passwordsMatch) {
      setError('passwordsDoNotMatch');
      return;
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.status === 201) {
      router.push('/auth/signin');
    } else {
      setError(data.error || 'An error occurred');
    }
  };

  return (
    <>
      <Head>
        <title>{t('signup')} | BraveStep</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold mb-4">{t('signup')}</h1>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {t(error) || error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded bg-blue-50"
              />
            </div>
            <div>
              <label className="block mb-1">{t('password')}</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded pr-10 bg-blue-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  className="absolute right-2 top-2 text-gray-500"
                  aria-label={showPass ? t('hide') : t('show')}
                >
                  {showPass ? (
                    // Akytė atvira
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    // Akytė perbraukta
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.045 10.045 0 013.042-4.467m3.687-2.316A9.982 9.982 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.969 9.969 0 01-4.302 5.135M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block mb-1">{t('confirmPassword')}</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded pr-10 bg-blue-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  className="absolute right-2 top-2 text-gray-500"
                  aria-label={showConfirm ? t('hide') : t('show')}
                >
                  {showConfirm ? (
                    // Akytė atvira
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    // Akytė perbraukta
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.045 10.045 0 013.042-4.467m3.687-2.316A9.982 9.982 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.969 9.969 0 01-4.302 5.135M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
              {confirm && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1">{t('passwordsDoNotMatch')}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              disabled={!passwordsMatch}
            >
              {t('createAccount')}
            </button>
            <div className="text-sm text-center mt-2">
              {t('alreadyHaveAccount')} <a href="/auth/signin" className="text-blue-600 hover:underline">{t('signin')}</a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
