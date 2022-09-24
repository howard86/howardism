import { ChakraProvider } from "@chakra-ui/react";
import theme from "@howardism/theme";
import { ChildrenProps } from "react";

const ThemeProvider = ({ children }: ChildrenProps) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
);

export default ThemeProvider;
