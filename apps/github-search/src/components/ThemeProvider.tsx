import { ChakraProvider } from "@chakra-ui/react"
import theme from "@howardism/theme"
import { ChildrenProps } from "react"

export default function ThemeProvider({ children }: ChildrenProps) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>
}
