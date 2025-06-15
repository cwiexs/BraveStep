// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Įkeliam…</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>BraveStep</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-5xl font-bold mb-8">BraveStep</h1>

        {!session ? (
          <div className="space-y-4 text-center">
            <button
              onClick={() => signIn()}
              className="w-64 px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
            >
              Prisijungti (El. paštu)
            </button>
            <button
              onClick={() => signIn('facebook')}
              className="w-64 px-6 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 transition"
            >
              Prisijungti per Facebook
            </button>
            <p>
              Neturi paskyros?{' '}
              <Link href="/auth/signup">
                <a className="text-blue-600 hover:underline">Sukurti paskyrą</a>
              </Link>
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">Sveiki, {session.user.name}!</p>
            <button
              onClick={() => signOut()}
              className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
            >
              Atsijungti
            </button>
          </div>
        )}
      </div>
    </>
  );
}
