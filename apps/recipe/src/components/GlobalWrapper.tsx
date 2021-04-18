import React, { FC } from "react";
import { ChakraProvider, Container } from "@chakra-ui/react";
import theme from "@/styles/theme";
import NavBar from "./NavBar";

const GlobalWrapper: FC = ({ children }) => (
  <ChakraProvider theme={theme}>
    <NavBar />
    <Container maxW="full" minH="100vh" px="0" bg="secondary.50">
      {children}
    </Container>
  </ChakraProvider>
);

export default GlobalWrapper;
