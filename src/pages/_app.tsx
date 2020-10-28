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
      <link
        href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        rel="stylesheet"
      ></link>
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
