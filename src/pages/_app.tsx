import React, { FC } from "react";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";

import GlobalStyle from "@/styles/global";
import Layout from "@/components/Layout";
import theme from "@/styles/theme";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <ThemeProvider theme={theme}>
    <Layout>
      <Component {...pageProps} />
    </Layout>
    <GlobalStyle />
  </ThemeProvider>
);

export default App;
