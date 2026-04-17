import { type AppType } from "next/app";
import { SessionProvider } from "next-auth/react";
import { type Session } from "next-auth";
import "~/styles/globals.css";

type AppProps = {
  session: Session | null;
  [key: string]: any;
};

const MyApp: AppType<AppProps> = ({ Component, pageProps }) => {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
};

export default MyApp;