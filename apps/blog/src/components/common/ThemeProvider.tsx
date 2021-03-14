import React, { FC } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "@howardism/theme";

const ThemeProvider: FC = ({ children }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
);

export default ThemeProvider;
