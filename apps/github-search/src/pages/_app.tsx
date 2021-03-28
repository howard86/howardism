import React, { FC } from "react";
import type { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client";

import ThemeProvider from "@/components/ThemeProvider";
import Layout from "@/components/Layout";
import client from "@/utils/apollo-client";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <ApolloProvider client={client}>
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  </ApolloProvider>
);

export default App;
