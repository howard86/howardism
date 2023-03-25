import { render, screen } from "@testing-library/react"
import Home from "@/pages"

describe("home", () => {
  it("renders the Home component", () => {
    expect.hasAssertions()
    render(<Home />)
    const homeElement = screen.getByText(/home/i)
    expect(homeElement).toBeInTheDocument()
  })
})
