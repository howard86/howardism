import React, { FC } from "react";
import { ChakraProvider, Container } from "@chakra-ui/react";
import NavBar from "./NavBar";

const GlobalWrapper: FC = ({ children }) => (
  <ChakraProvider>
    <NavBar />
    {/* TODO: update pt with responsive styles */}
    <Container maxW="full" px="0" pt="20" bg="blackAlpha.800">
      {children}
    </Container>
  </ChakraProvider>
);

export default GlobalWrapper;
