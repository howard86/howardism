import React, { FC } from "react";
import { ChakraProvider } from "@chakra-ui/react";

const GlobalWrapper: FC = ({ children }) => <ChakraProvider>{children}</ChakraProvider>;

export default GlobalWrapper;
