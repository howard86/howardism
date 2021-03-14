import React, { FC } from "react";
import type { AppProps } from "next/app";
import ThemeProvider from "@/common/ThemeProvider";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <ThemeProvider>
    <Component {...pageProps} />;
  </ThemeProvider>
);

export default App;
