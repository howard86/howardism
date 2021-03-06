import React, { FC } from "react";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { DefaultSeo } from "next-seo";

import Layout from "@/components/layout/Layout";
import theme from "@/styles/theme";
import DEFAULT_SEO from "@/constants/seo";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <DefaultSeo {...DEFAULT_SEO} />
    <ChakraProvider theme={theme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ChakraProvider>
  </>
);

export default App;
