import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { Chip } from "@/components/howardism/Chip";
import { DataGrid } from "@/components/howardism/DataGrid";
import { DiscPageHeader } from "@/components/howardism/DiscPageHeader";
import { Eyebrow } from "@/components/howardism/Eyebrow";
import { HalfDisc } from "@/components/howardism/HalfDisc";
import { Ph } from "@/components/howardism/Ph";
import { PhotoCard } from "@/components/howardism/PhotoCard";
import { Squiggle } from "@/components/howardism/Squiggle";
import { SunDisc } from "@/components/howardism/SunDisc";

afterEach(() => {
  cleanup();
});

describe("SunDisc", () => {
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

describe("HalfDisc", () => {
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

describe("DataGrid", () => {
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

describe("DiscPageHeader", () => {
  it("renders volume label", () => {
    render(
      <DiscPageHeader
        number="03"
        plate="Plate III"
        title="Photos"
        volume="Howardism · Vol. 03"
      />
    );
    expect(screen.getByTestId("disc-page-header").textContent).toContain(
      "Howardism · Vol. 03"
    );
  });

  it("renders plate and number in masthead", () => {
    render(
      <DiscPageHeader
        number="04"
        plate="Plate IV"
        title="About"
        volume="Vol."
      />
    );
    const header = screen.getByTestId("disc-page-header");
    expect(header.textContent).toContain("Plate IV");
    expect(header.textContent).toContain("04");
  });

  it("composes SunDisc", () => {
    render(
      <DiscPageHeader number="01" plate="Plate I" title="Home" volume="Vol." />
    );
    expect(screen.getByTestId("sun-disc")).toBeDefined();
  });

  it("renders DataGrid when data prop supplied", () => {
    render(
      <DiscPageHeader
        data={[
          ["Frames", "36"],
          ["Since", "2022"],
        ]}
        number="03"
        plate="Plate III"
        title="Photos"
        volume="Vol."
      />
    );
    expect(screen.getByTestId("data-grid")).toBeDefined();
    expect(screen.getByTestId("disc-page-header").textContent).toContain(
      "Frames"
    );
  });
});

describe("Eyebrow", () => {
  it("renders children inside hw-eyebrow element", () => {
    render(<Eyebrow>Journal · est. 2023</Eyebrow>);
    const el = document.querySelector(".hw-eyebrow");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("Journal · est. 2023");
  });

  it("applies className", () => {
    render(<Eyebrow className="mb-4">Label</Eyebrow>);
    const el = document.querySelector(".hw-eyebrow");
    expect(el?.className).toContain("mb-4");
  });
});

describe("Squiggle", () => {
  it("renders an SVG element", () => {
    const { container } = render(<Squiggle />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("contains a path element", () => {
    const { container } = render(<Squiggle />);
    const path = container.querySelector("path");
    expect(path).not.toBeNull();
    expect(path?.getAttribute("stroke")).toBe("currentColor");
  });

  it("is aria-hidden", () => {
    const { container } = render(<Squiggle />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });
});

describe("Ph", () => {
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

describe("Chip", () => {
  it("renders children text", () => {
    render(<Chip>now in Singapore</Chip>);
    expect(document.querySelector(".hw-chip")?.textContent).toContain(
      "now in Singapore"
    );
  });

  it("renders dot element when dot prop is true", () => {
    render(<Chip dot>Programming</Chip>);
    const dot = document.querySelector(".hw-dot");
    expect(dot).not.toBeNull();
  });

  it("does not render dot when dot prop is false", () => {
    render(<Chip>Programming</Chip>);
    expect(document.querySelector(".hw-dot")).toBeNull();
  });

  it("applies className", () => {
    render(<Chip className="mt-2">Tag</Chip>);
    expect(document.querySelector(".hw-chip")?.className).toContain("mt-2");
  });
});

describe("PhotoCard", () => {
  it("renders tape strip when tape prop is true", () => {
    render(<PhotoCard label="Tioman" tape />);
    expect(document.querySelector(".hw-tape")).not.toBeNull();
  });

  it("does not render tape when tape prop is omitted", () => {
    render(<PhotoCard label="Tioman" />);
    expect(document.querySelector(".hw-tape")).toBeNull();
  });

  it("renders caption when provided", () => {
    render(<PhotoCard caption="Shoal of snapper" label="Tioman" />);
    expect(document.querySelector("figcaption")?.textContent).toContain(
      "Shoal of snapper"
    );
  });

  it("composes Ph placeholder", () => {
    render(<PhotoCard aspect="3/4" label="Reef" tone={1} />);
    expect(screen.getByTestId("ph")).toBeDefined();
  });
});
