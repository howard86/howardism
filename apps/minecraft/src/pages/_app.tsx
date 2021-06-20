import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";

const App: NextPage<AppProps> = ({ Component, pageProps }) => (
  <>
    <Head>
      <title>React Minecraft</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <Component {...pageProps} />
  </>
);

export default App;
