import { useState } from 'react';
import BookPageLayout from '../components/BookPageLayout';
import Navbar from '../components/Navbar';
import WelcomeSection from '../components/WelcomeSection';
import FeaturesSection from '../components/FeaturesSection';
import SignIn from '../components/SignIn';
import SignUp from '../components/SignUp';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  const [view, setView] = useState('welcome'); // 'welcome' | 'login' | 'signup'

  return (
    <div className="min-h-screen bg-gray-100">
      <BookPageLayout>
        <Navbar
          onHome={() => setView('welcome')}
          onSignIn={() => setView('login')}
          onSignUp={() => setView('signup')}
        />
        {view === 'welcome' && (
          <>
            <WelcomeSection onSignIn={() => setView('login')} onSignUp={() => setView('signup')} />
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
