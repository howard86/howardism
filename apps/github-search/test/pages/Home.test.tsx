import { screen } from "@testing-library/react";

import HomePage from "@/pages/index";

import { customRender } from "../test-utils";

describe("homePage", () => {
  it("renders input and button", () => {
    expect.hasAssertions();
    customRender(<HomePage />);
    expect(screen.getByPlaceholderText("GitHub username")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });
});
