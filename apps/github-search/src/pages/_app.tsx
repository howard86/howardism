import React, { FC } from "react";
import type { AppProps } from "next/app";
import { ApolloProvider } from "@apollo/client";

import ThemeProvider from "@/common/ThemeProvider";
import client from "@/utils/apollo-client";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <ApolloProvider client={client}>
    <ThemeProvider>
      <Component {...pageProps} />;
    </ThemeProvider>
  </ApolloProvider>
);

export default App;
