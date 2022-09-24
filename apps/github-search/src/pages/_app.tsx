import { ApolloProvider } from "@apollo/client";
import type { NextPage } from "next";
import type { AppProps } from "next/app";

import Layout from "@/components/Layout";
import ThemeProvider from "@/components/ThemeProvider";
import client from "@/utils/apollo-client";

const App: NextPage<AppProps> = ({ Component, pageProps }) => (
  <ApolloProvider client={client}>
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  </ApolloProvider>
);

export default App;
