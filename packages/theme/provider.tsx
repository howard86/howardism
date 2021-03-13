import React, { FC } from "react";
import { ChakraProvider, ChakraProviderProps } from "@chakra-ui/react";
import theme from "./theme";

const ThemeProvider: FC<ChakraProviderProps> = ({ children, ...props }) => (
  <ChakraProvider theme={theme} {...props}>
    {children}
  </ChakraProvider>
);

export default ThemeProvider;
