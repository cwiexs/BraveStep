import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';


export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
export default appWithTranslation(App);