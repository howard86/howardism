import React, { FC } from "react";
import Head from "next/head";
import type { AppProps } from "next/app";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <Head>Next.js Template</Head>
    <Component {...pageProps} />
  </>
);

export default App;
