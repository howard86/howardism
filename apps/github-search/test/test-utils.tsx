import { ChildrenProps, ReactElement } from "react"
import { ApolloProvider } from "@apollo/client"
import { render, RenderOptions, RenderResult } from "@testing-library/react"

import ThemeProvider from "@/components/ThemeProvider"
import client from "@/utils/apollo-client"

export default function Provider({ children }: ChildrenProps) {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider>{children}</ThemeProvider>
    </ApolloProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "quries">): RenderResult =>
  render(ui, { wrapper: Provider, ...options })

export * from "@testing-library/react"
export { customRender as render }
