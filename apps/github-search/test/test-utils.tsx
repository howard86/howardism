import { ApolloProvider } from "@apollo/client";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { ChildrenProps, ReactElement } from "react";

import ThemeProvider from "@/components/ThemeProvider";
import client from "@/utils/apollo-client";

const Provider = ({ children }: ChildrenProps) => (
  <ApolloProvider client={client}>
    <ThemeProvider>{children}</ThemeProvider>
  </ApolloProvider>
);

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "quries">): RenderResult =>
  render(ui, { wrapper: Provider, ...options });

export * from "@testing-library/react";
export { customRender as render };
