import { render, screen } from "@testing-library/react"
import Home from "@/pages"

describe("home", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the dynamic component", async () => {
    expect.hasAssertions()

    render(<Home />)
    const dynamicComponent = await screen.findByTestId("dynamic-component")
    expect(dynamicComponent).toBeInTheDocument()
  })
})
