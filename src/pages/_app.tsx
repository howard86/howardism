import React, { FC } from "react";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";
import { DefaultSeo } from "next-seo";

import GlobalStyle from "@/styles/global";
import Layout from "@/containers/Layout";
import theme from "@/styles/theme";
import DEFAULT_SEO from "@/constants/seo";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <DefaultSeo {...DEFAULT_SEO} />
    <ThemeProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <GlobalStyle />
    </ThemeProvider>
  </>
);

export default App;
