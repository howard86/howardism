import { ChakraProvider, Container } from "@chakra-ui/react";
import React, { FC } from "react";
import { Provider as ReduxProvider } from "react-redux";

import store from "@/redux/store";
import theme from "@/styles/theme";

import NavBar from "./layouts/NavBar";

const GlobalWrapper: FC = ({ children }) => (
  <ChakraProvider theme={theme}>
    <ReduxProvider store={store}>
      <NavBar />
      <Container maxW="full" minH="100vh" px="0" bg="secondary.50">
        {children}
      </Container>
    </ReduxProvider>
  </ChakraProvider>
);

export default GlobalWrapper;
