import { ApolloProvider } from "@apollo/client";
import type { AppProps } from "next/app";

import Layout from "@/components/Layout";
import ThemeProvider from "@/components/ThemeProvider";
import client from "@/utils/apollo-client";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </ApolloProvider>
  );
}
