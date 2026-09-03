import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import useScrollSpy from "@/hooks/use-scroll-spy";

const SECTION_IDS = ["a", "b", "c", "d"];
// Two headings scrolled past the 96px anchor, two still below it.
const TOPS: Record<string, number> = { a: -200, b: -40, c: 300, d: 600 };

const measured: string[] = [];
let realGetRect: typeof Element.prototype.getBoundingClientRect;
let realObserver: typeof globalThis.IntersectionObserver;

/** Nothing intersects, so the hook takes its fallback path — the one measured. */
class InertIntersectionObserver {
  observe() {
    return;
  }
  disconnect() {
    return;
  }
}

beforeAll(() => {
  realGetRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function stub(this: Element) {
    if (this.id in TOPS) {
      measured.push(this.id);
    }
    return { top: TOPS[this.id] ?? 0 } as DOMRect;
  };
  realObserver = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver =
    InertIntersectionObserver as unknown as typeof globalThis.IntersectionObserver;
});

afterAll(() => {
  Element.prototype.getBoundingClientRect = realGetRect;
  globalThis.IntersectionObserver = realObserver;
});

afterEach(cleanup);

function Harness() {
  const active = useScrollSpy({ sectionIds: SECTION_IDS });
  return (
    <div>
      {SECTION_IDS.map((id) => (
        <h2 id={id} key={id}>
          {id}
        </h2>
      ))}
      <span data-testid="active">{active ?? "none"}</span>
    </div>
  );
}

describe("useScrollSpy fallback anchor", () => {
  it("stops measuring at the first heading below the anchor", () => {
    measured.length = 0;
    render(<Harness />);

    // `c` is the first heading at or below the anchor, so it ends the scan and
    // `d` is never measured. The last heading above the anchor still wins.
    expect(measured).toEqual(["a", "b", "c"]);
    expect(screen.getByTestId("active").textContent).toBe("b");
  });
});
