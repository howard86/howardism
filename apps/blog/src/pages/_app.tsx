import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

import Layout from "@/components/layout/Layout";
import DEFAULT_SEO from "@/constants/seo";
import theme from "@/theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultSeo {...DEFAULT_SEO} />
      <ChakraProvider theme={theme}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </>
  );
}
