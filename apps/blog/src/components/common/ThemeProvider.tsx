import { ChakraProvider } from "@chakra-ui/react";
import theme from "@howardism/theme";
import React, { FC } from "react";

const ThemeProvider: FC = ({ children }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
);

export default ThemeProvider;
