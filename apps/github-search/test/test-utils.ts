import { ReactElement } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import ThemeProvider from "@/components/ThemeProvider";

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "quries">): RenderResult =>
  render(ui, { wrapper: ThemeProvider, ...options });

export * from "@testing-library/react";
export { customRender as render };
