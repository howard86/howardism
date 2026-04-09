import { ApolloProvider } from "@apollo/client/react";
import type { AppProps } from "next/app";

import Layout from "@/components/Layout";
import client from "@/utils/apollo-client";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ApolloProvider>
  );
}
