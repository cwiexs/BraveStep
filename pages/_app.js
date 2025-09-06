
import { appWithTranslation } from "next-i18next";
import { SessionProvider } from "next-auth/react";
import LocaleBootstrapper from "../components/LocaleBootstrapper";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <LocaleBootstrapper />
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default appWithTranslation(MyApp);
