import '../styles/globals.css'
import { appWithTranslation } from 'next-i18next';
import { SessionProvider } from 'next-auth/react';

function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-100">
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  );
}

export default appWithTranslation(App);
