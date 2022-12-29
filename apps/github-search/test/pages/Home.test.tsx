import MatchMediaMock from "jest-matchmedia-mock"

import HomePage from "@/pages/index"

import { render } from "../test-utils"

let matchMedia: MatchMediaMock

describe("HomePage", () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock()
  })

  afterEach(() => {
    matchMedia.clear()
  })

  it("should render Home page", () => {
    render(<HomePage />, {})
  })
})
