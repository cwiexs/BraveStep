// pages/index.js
import Head from 'next/head';
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
        <title>BraveStep Sporto Planai</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-5xl font-bold mb-8">BraveStep</h1>

        {session ? (
          <div className="text-center">
            <p className="mb-4">Sveiki, {session.user.name}!</p>
            <button
              onClick={() => signOut()}
              className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
            >
              Atsijungti
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('facebook')}
            className="px-6 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 transition"
          >
            Prisijungti per Facebook
          </button>
        )}
      </div>
    </>
  );
}
