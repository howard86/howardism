import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { ChildrenProps, ReactElement } from "react";

const Providers = ({ children }: ChildrenProps) => {
  return <>{children}</>;
};

const customRender = (ui: ReactElement, options: RenderOptions = {}): RenderResult =>
  render(ui, { wrapper: Providers, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
