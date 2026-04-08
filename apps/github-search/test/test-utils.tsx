import { ApolloProvider } from "@apollo/client";
import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import type { ChildrenProps, ReactElement } from "react";

import client from "@/utils/apollo-client";

export default function Provider({ children }: ChildrenProps) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">
): RenderResult => render(ui, { wrapper: Provider, ...options });
