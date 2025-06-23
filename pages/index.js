import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

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
      {/* NAVBAR */}
      <nav className="w-full bg-white shadow-sm py-4">
        <div className="container mx-auto flex justify-between items-center px-6">
          <div className="font-bold text-xl tracking-wide">BraveStep</div>
          <ul className="flex gap-8">
            <li><Link href="/"><span className="hover:text-blue-700">Home</span></Link></li>
            <li><Link href="#"><span className="hover:text-blue-700">Workouts</span></Link></li>
            <li><Link href="#"><span className="hover:text-blue-700">Nutrition</span></Link></li>
            <li><Link href="#"><span className="hover:text-blue-700">Health</span></Link></li>
            {session ? (
              <li>
                <button onClick={() => signOut()} className="hover:text-blue-700">Sign Out</button>
              </li>
            ) : (
              <li>
                <button onClick={() => signIn()} className="hover:text-blue-700">Sign In</button>
              </li>
            )}
          </ul>
        </div>
      </nav>

{/* HEADER */}
<header className="container mx-auto flex flex-col md:flex-row items-center justify-between py-12 px-6">
  {/* Left side: Text */}
  <div className="flex-1 mb-10 md:mb-0 md:mr-8">
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
