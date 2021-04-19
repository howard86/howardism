import React from "react";
import HomePage from "@/pages/index";
import { render } from "../testUtils";

describe("HomePage", () => {
  it("should render", () => {
    render(<HomePage />, {});
  });
});
