import { render, RenderOptions, RenderResult } from "@testing-library/react"
import { ReactElement } from "react"

const customRender = (ui: ReactElement, options: RenderOptions = {}): RenderResult =>
  render(ui, options)

// re-export everything
export * from "@testing-library/react"

// override render method
export { customRender as render }
