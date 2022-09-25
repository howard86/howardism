import { useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import Aos from "aos";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

import Layout from "@/components/layout/Layout";
import DEFAULT_SEO from "@/constants/seo";
import theme from "@/theme";

import "aos/dist/aos.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    Aos.init();
  }, []);

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
