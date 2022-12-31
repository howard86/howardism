import { ChildrenProps } from "react"
import { ChakraProvider } from "@chakra-ui/react"

import theme from "@howardism/theme"

export default function ThemeProvider({ children }: ChildrenProps) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>
}
