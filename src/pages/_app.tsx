import React, { FC } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider } from "styled-components";

import GlobalStyle from "@/styles/global";
import Layout from "@/containers/Layout";
import theme from "@/styles/theme";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <Head>
      <title>Howardism</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <ThemeProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <GlobalStyle />
    </ThemeProvider>
  </>
);

export default App;
