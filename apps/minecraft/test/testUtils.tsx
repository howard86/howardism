import { render, RenderOptions, RenderResult } from "@testing-library/react";
import React, { FC, ReactElement } from "react";

const Providers: FC = ({ children }) => {
  return <>{children}</>;
};

const customRender = (ui: ReactElement, options: RenderOptions = {}): RenderResult =>
  render(ui, { wrapper: Providers, ...options });

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
