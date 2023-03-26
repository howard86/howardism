import "@testing-library/jest-dom/extend-expect"

import * as mockRouter from "next-router-mock"

jest.mock("next/router", () => mockRouter)
