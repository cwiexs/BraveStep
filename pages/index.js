import { useState } from 'react';
import BookPageLayout from '../components/BookPageLayout';
import Navbar from '../components/Navbar';
import WelcomeSection from '../components/WelcomeSection';
import FeaturesSection from '../components/FeaturesSection';
import SignIn from '../components/SignIn';
import SignUp from '../components/SignUp';
import MemberSection from '../components/MemberSection';
import MyProfile from '../components/MyProfile'; 
import Workouts from "../components/Workouts";
import { useSession } from 'next-auth/react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

export default function Home() {
  const [view, setView] = useState('welcome'); // 'welcome' | 'login' | 'signup' | 'profile' | 'workouts'
  const { data: session } = useSession();
  const router = useRouter();

  // Funkcija kalbai keisti
  const handleLanguageChange = async (locale) => {
    await router.push(router.pathname, router.asPath, { locale });
  };

  // Funkcija MyProfile langui
  const handleMyProfile = () => {
    setView('profile');
  };

  // Funkcija Workouts langui
  const handleWorkouts = () => {
    setView('workouts');
  };

  return (
    <div className="min-h-screen">
      <BookPageLayout>
        <Navbar
          onHome={() => setView('welcome')}
          onSignIn={() => setView('login')}
          onSignUp={() => setView('signup')}
          session={session}
          onLanguageChange={handleLanguageChange}
          onMyProfile={handleMyProfile}
          onWorkouts={handleWorkouts} // <-- SVARBU!
        />
        {!session ? (
          <>
            {view === 'welcome' && (
              <>
                <WelcomeSection
                  onSignIn={() => setView('login')}
                  onSignUp={() => setView('signup')}
                />
                <FeaturesSection />
              </>
            )}
            {view === 'login' && (
              <SignIn
                onSignUp={() => setView('signup')}
                onHome={() => setView('welcome')}
              />
            )}
            {view === 'signup' && (
              <SignUp
                onSignIn={() => setView('login')}
                onHome={() => setView('welcome')}
              />
            )}
            {view === 'workouts' && <Workouts />}
          </>
        ) : (
          <>
            <div className={view === 'profile' ? '' : 'hidden'}>
              <MyProfile />
            </div>
            <div className={view === 'workouts' ? '' : 'hidden'}>
              <Workouts />
            </div>
            <div className={view === 'profile' || view === 'workouts' ? 'hidden' : ''}>
              <MemberSection user={session.user} />
            </div>
          </>
        )}
      </BookPageLayout>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
