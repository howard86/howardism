import { ReactElement } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "quries">): RenderResult =>
  render(ui, options);

export * from "@testing-library/react";
export { customRender as render };
