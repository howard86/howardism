import React, { FC } from "react";
import { AppProps } from "next/app";
import { ThemeProvider } from "@howardism/theme";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <ThemeProvider>
    <Component {...pageProps} />;
  </ThemeProvider>
);

export default App;
