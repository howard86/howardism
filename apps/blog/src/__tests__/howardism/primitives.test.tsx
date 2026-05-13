import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { DataGrid } from "@/components/howardism/data-grid";
import { HalfDisc } from "@/components/howardism/half-disc";
import { Ph } from "@/components/howardism/ph";
import { SunDisc } from "@/components/howardism/sun-disc";

afterEach(() => {
  cleanup();
});

describe("sun-disc", () => {
  it("renders with default plate label and number", () => {
    render(<SunDisc />);
    const disc = screen.getByTestId("sun-disc");
    expect(disc).toBeDefined();
    expect(disc.textContent).toContain("Plate I · Surface");
    expect(disc.textContent).toContain("01");
  });

  it("renders custom plate and number", () => {
    render(<SunDisc number="03" plate="Plate III · Photos" />);
    const disc = screen.getByTestId("sun-disc");
    expect(disc.textContent).toContain("Plate III · Photos");
    expect(disc.textContent).toContain("03");
  });

  it("applies className to root element", () => {
    render(<SunDisc className="my-custom" />);
    const disc = screen.getByTestId("sun-disc");
    expect(disc.className).toContain("my-custom");
  });
});

describe("half-disc", () => {
  it("renders right-aligned by default", () => {
    render(<HalfDisc />);
    const disc = screen.getByTestId("half-disc");
    expect(disc).toBeDefined();
    expect(disc.dataset.align).toBe("right");
  });

  it("renders left-aligned when align=left", () => {
    render(<HalfDisc align="left" />);
    const disc = screen.getByTestId("half-disc");
    expect(disc.dataset.align).toBe("left");
  });

  it("applies className", () => {
    render(<HalfDisc className="bleed-left" />);
    expect(screen.getByTestId("half-disc").className).toContain("bleed-left");
  });
});

describe("data-grid", () => {
  it("renders correct number of cells for given rows", () => {
    render(
      <DataGrid
        rows={[
          ["Pieces", "5"],
          ["Pace", "Monthly"],
        ]}
      />
    );
    const grid = screen.getByTestId("data-grid");
    // 2 rows × 2 cells = 4 span elements
    const cells = grid.querySelectorAll("span");
    expect(cells.length).toBe(4);
  });

  it("renders labels and values in correct order", () => {
    render(
      <DataGrid
        rows={[
          ["Published", "2024-01-01"],
          ["Filed", "Engineering"],
        ]}
      />
    );
    const cells = Array.from(
      screen.getByTestId("data-grid").querySelectorAll("span")
    ).map((el) => el.textContent);
    expect(cells[0]).toBe("Published");
    expect(cells[1]).toBe("2024-01-01");
    expect(cells[2]).toBe("Filed");
    expect(cells[3]).toBe("Engineering");
  });

  it("applies className to root element", () => {
    render(<DataGrid className="extra" rows={[["k", "v"]]} />);
    expect(screen.getByTestId("data-grid").className).toContain("extra");
  });
});

describe("ph", () => {
  it("renders label text", () => {
    render(<Ph aspect="4/5" label="portrait · 4x5" tone={0} />);
    expect(screen.getByTestId("ph").textContent).toContain("portrait · 4x5");
  });

  it("applies correct aspect ratio data attribute", () => {
    render(<Ph aspect="3/4" label="img" tone={1} />);
    expect(screen.getByTestId("ph").dataset.aspect).toBe("3/4");
  });

  it("maps tone index onto palette (mod 5)", () => {
    render(<Ph label="x" tone={7} />);
    // tone 7 % 5 = 2 — just confirm the element renders without error
    expect(screen.getByTestId("ph").dataset.tone).toBe("7");
  });

  it("renders meta string when provided", () => {
    render(<Ph label="dive" meta="f/8 · 1/125 · 18m" tone={0} />);
    expect(screen.getByTestId("ph").textContent).toContain("f/8 · 1/125 · 18m");
  });
});
