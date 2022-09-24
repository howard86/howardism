import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { ChildrenProps, ReactElement } from "react";

import GlobalWrapper from "@/components/GlobalWrapper";

const Providers = ({ children }: ChildrenProps) => {
  return <GlobalWrapper>{children}</GlobalWrapper>;
};

const customRender = (ui: ReactElement, options: RenderOptions = {}): RenderResult =>
  render(ui, { wrapper: Providers, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
