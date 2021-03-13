import React from "react";
import Home from "@/pages/index";
import { render } from "../test-utils";

describe("HomePage", () => {
  it("should render Home page", () => {
    render(<Home />, {});
  });
});
