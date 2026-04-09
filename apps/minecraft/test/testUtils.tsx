import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import type { ReactElement } from "react";

const customRender = (
  ui: ReactElement,
  options: RenderOptions = {}
): RenderResult => render(ui, options);

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
