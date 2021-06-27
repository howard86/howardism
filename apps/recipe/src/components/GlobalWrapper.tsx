import { ChakraProvider } from "@chakra-ui/react";
import React, { FC } from "react";
import { Provider as ReduxProvider } from "react-redux";

import store from "@/redux/store";
import theme from "@/styles/theme";

import Layout from "./layouts/Layout";

const GlobalWrapper: FC = ({ children }) => (
  <ChakraProvider theme={theme}>
    <ReduxProvider store={store}>
      <Layout>{children}</Layout>
    </ReduxProvider>
  </ChakraProvider>
);

export default GlobalWrapper;
