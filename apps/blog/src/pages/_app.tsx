import React from "react";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import { DefaultSeo } from "next-seo";
import ThemeProvider from "@/components/common/ThemeProvider";

import Layout from "@/components/layout/Layout";
import DEFAULT_SEO from "@/constants/seo";

const App: NextPage<AppProps> = ({ Component, pageProps }) => (
  <>
    <DefaultSeo {...DEFAULT_SEO} />
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  </>
);

export default App;
