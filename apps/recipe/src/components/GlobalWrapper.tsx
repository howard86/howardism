import { ChildrenProps } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ChakraProvider } from "@chakra-ui/react";

import store from "@/redux/store";
import theme from "@/styles/theme";

import Layout from "./layouts/Layout";

export default function GlobalWrapper({ children }: ChildrenProps) {
  return (
    <ChakraProvider theme={theme}>
      <ReduxProvider store={store}>
        <Layout>{children}</Layout>
      </ReduxProvider>
    </ChakraProvider>
  );
}
