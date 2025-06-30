// components/Navbar.js

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
// Pridedam naują importą
import MyProfileModal from './MyProfileModal'; // <-- naujas komponentas

export default function Navbar() {
  const { data: session } = useSession();
  const { t } = useTranslation('common');

  // Nauja būsena modalui
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      {/* --- PRADŽIA: tavo esamas navbar kodas, niekas netrinama --- */}
      <nav className="flex items-center justify-between px-4 py-2 bg-gray-100">
        <div>
          <Link href="/">
            <span className="font-bold text-xl cursor-pointer">BraveStep</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {/* Čia paliekam visus tavo esamus menu punktus */}
          {/* Pridedam naują mygtuką TIK prisijungus */}
          {session && (
            <button
              onClick={() => setProfileOpen(true)}
              className="hover:underline"
              type="button"
            >
              {t('myProfile')}
            </button>
          )}
          {/* Kiti tavo prisijungimo/atsijungimo mygtukai */}
          {!session ? (
            <button onClick={() => signIn()} className="bg-blue-600 text-white px-3 py-1 rounded">
              {t('signIn')}
            </button>
          ) : (
            <button onClick={() => signOut()} className="bg-red-600 text-white px-3 py-1 rounded">
              {t('signOut')}
            </button>
          )}
        </div>
      </nav>
      {/* --- PABAIGA: tavo navbar kodas --- */}

      {/* Čia pridedamas MODALAS, rodomas tik jei atidarytas */}
      <MyProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
