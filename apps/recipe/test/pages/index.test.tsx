import React, { ClassAttributes, ImgHTMLAttributes } from "react";

import HomePage from "@/pages/index";

import { render } from "../testUtils";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (
    props: JSX.IntrinsicAttributes &
      ClassAttributes<HTMLImageElement> &
      ImgHTMLAttributes<HTMLImageElement>
  ) => <img alt="test" {...props} />,
}));

describe("HomePage", () => {
  it("should render", () => {
    render(<HomePage recipes={[]} />, {});
  });
});
