import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  type ComparePanel,
  CompareView,
} from "@/app/(blog)/compare/compare-view";

afterEach(cleanup);

const panels: ComparePanel[] = [
  {
    slug: "alpha",
    title: "Alpha",
    href: "/articles/alpha",
    body: <p>Alpha body</p>,
  },
  {
    slug: "beta",
    title: "Beta",
    href: "/articles/beta",
    body: <p>Beta body</p>,
  },
];

describe("CompareView", () => {
  it("renders every panel body and a tab per article", () => {
    render(<CompareView panels={panels} />);

    expect(screen.getByText("Alpha body")).not.toBeNull();
    expect(screen.getByText("Beta body")).not.toBeNull();
    // Each article title appears as both a tab and a panel heading link.
    expect(screen.getAllByRole("button", { name: "Alpha" })).toHaveLength(1);
  });

  it("marks the first tab active and switches on click", () => {
    render(<CompareView panels={panels} />);

    const alphaTab = screen.getByRole("button", { name: "Alpha" });
    const betaTab = screen.getByRole("button", { name: "Beta" });
    expect(alphaTab.getAttribute("aria-pressed")).toBe("true");
    expect(betaTab.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(betaTab);

    expect(alphaTab.getAttribute("aria-pressed")).toBe("false");
    expect(betaTab.getAttribute("aria-pressed")).toBe("true");
  });
});
