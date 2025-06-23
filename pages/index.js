import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react'; // svarbus importas hamburger meniu

export default function Home() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

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
      {/* NAVBAR */}
      <nav className="w-full bg-white shadow-sm py-4">
        <div className="container mx-auto flex justify-between items-center px-6">
          {/* Kairė: logotipas + meniu */}
          <div className="flex items-center">
            {/* Meniu matomas tik kompiuteryje */}
            <ul className="hidden md:flex gap-8">
              <li><Link href="/"><span className="hover:text-blue-700">Home</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">Workouts</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">Nutrition</span></Link></li>
              <li><Link href="#"><span className="hover:text-blue-700">Health</span></Link></li>
            </ul>
          </div>
          {/* Dešinė: SignIn ir hamburger */}
          <div className="flex items-center gap-4">
            {/* SignIn/SignOut matomas tik kompiuteryje */}
            <div className="hidden md:block">
              {session ? (
                <button onClick={() => signOut()} className="hover:text-blue-700">Sign Out</button>
              ) : (
                <button onClick={() => signIn()} className="hover:text-blue-700">Sign In</button>
              )}
            </div>
            {/* Hamburger meniu tik telefone */}
            <button
              className="md:hidden focus:outline-none"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="text-3xl">☰</span>
            </button>
          </div>
        </div>
        {/* Mobile overlay meniu */}
        {menuOpen && (
          <div className="fixed inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-50 transition-all">
            <button
              className="absolute top-6 right-6 text-3xl"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >×</button>
            <ul className="flex flex-col gap-10 text-2xl font-semibold">
              <li onClick={() => setMenuOpen(false)}><Link href="/">Home</Link></li>
              <li onClick={() => setMenuOpen(false)}><Link href="#">Workouts</Link></li>
              <li onClick={() => setMenuOpen(false)}><Link href="#">Nutrition</Link></li>
              <li onClick={() => setMenuOpen(false)}><Link href="#">Health</Link></li>
              <li>
                {session ? (
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="hover:text-blue-700"
                  >Sign Out</button>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); signIn(); }}
                    className="hover:text-blue-700"
                  >Sign In</button>
                )}
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* HEADER */}
      <header className="container mx-auto flex flex-col md:flex-row items-center justify-between py-12 px-6">
        {/* Left side: Text */}
<div className="flex-1 mb-10 md:mb-0 flex flex-col items-start md:items-center md:text-center">
  <h1 className="text-4xl sm:text-5xl font-bold mb-4">
    Enhance Your<br />Well-Being
  </h1>
  <p className="text-gray-600 mb-7">
    Achieve your health and fitness goals<br />
    with personalized workout and nutrition plans.
  </p>
  <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-7 rounded-lg font-semibold text-lg shadow-md">
    Get Started
  </button>
</div>
        {/* Right side: Illustration */}
        <div className="flex-1 flex justify-center">
          <Image
            src="/hero.png"
            alt="Walking person"
            width={300}
            height={300}
            priority
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </header>

      {/* FEATURES */}
      <section className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-7 pb-16 px-6">
        {/* Feature 1 */}
        <div className="bg-white rounded-xl shadow-md flex flex-col items-center p-7">
          <div className="text-4xl mb-4">🏋️‍♂️</div>
          <h3 className="font-bold text-lg mb-2">Customized Workouts</h3>
          <p className="text-gray-600 text-center">Find exercises tailored to your fitness level and objectives.</p>
        </div>
        {/* Feature 2 */}
        <div className="bg-white rounded-xl shadow-md flex flex-col items-center p-7">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="font-bold text-lg mb-2">Meal Planning</h3>
          <p className="text-gray-600 text-center">Get personalized diet plans and nutritional guidance.</p>
        </div>
        {/* Feature 3 */}
        <div className="bg-white rounded-xl shadow-md flex flex-col items-center p-7">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-bold text-lg mb-2">Track Progress</h3>
          <p className="text-gray-600 text-center">Monitor your achievements and stay motivated.</p>
        </div>
      </section>
    </>
  );
}
