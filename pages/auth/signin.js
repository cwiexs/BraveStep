// pages/auth/signin.js
import Head from 'next/head';
import { getProviders, signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignIn({ providers }) {
  // Guard – jeigu providers nėra, rodome loading
  if (!providers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Įkraunama…</p>
      </div>
    );
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCredentials = async e => {
    e.preventDefault();
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    if (res.error) setError(res.error);
    else window.location.href = '/';
  };

  return (
    <>
      <Head><title>Prisijungti | BraveStep</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Prisijungti</h1>
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Credentials */}
          {providers.credentials && (
            <form onSubmit={handleCredentials} className="space-y-4 mb-6">
              <div>
                <label className="block mb-1">El. paštas</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Slaptažodis</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Prisijungti el. paštu
              </button>
            </form>
          )}

          {/* Facebook */}
          {providers.facebook && (
            <button
              onClick={() => signIn('facebook')}
              className="w-full py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
            >
              Prisijungti per Facebook
            </button>
          )}

          <p className="mt-4 text-center">
            Neturi paskyros?{' '}
            <a href="/auth/signup" className="text-blue-600 hover:underline">
              Sukurti paskyrą
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const providers = await getProviders();
  return { props: { providers: providers ?? null } };
}
