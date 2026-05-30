import { afterEach, beforeAll, describe, expect, it } from "bun:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { useFindHighlights } from "@/components/find/use-find-highlights";

// Minimal CSS Custom Highlight API so the hook runs under happy-dom.
class FakeHighlight {
  ranges: unknown[];
  constructor(...ranges: unknown[]) {
    this.ranges = ranges;
  }
}

beforeAll(() => {
  (globalThis as unknown as { Highlight: unknown }).Highlight = FakeHighlight;
  // happy-dom's `CSS` is a getter returning a fresh object per access, so mutating
  // it doesn't stick — replace it with a static stub carrying a highlights map.
  Object.defineProperty(globalThis, "CSS", {
    configurable: true,
    value: { highlights: new Map() },
  });
  Element.prototype.scrollIntoView = () => undefined;
});

afterEach(cleanup);

function Harness({ query, active }: { query: string; active: boolean }) {
  const { count, current, goNext, goPrev } = useFindHighlights(query, active);
  return (
    <div>
      <div data-article-body>
        <p>loop one</p>
        <p>loop two and loop three</p>
      </div>
      <span data-testid="status">
        {count === 0 ? "0" : `${current + 1}/${count}`}
      </span>
      <button onClick={goNext} type="button">
        next
      </button>
      <button onClick={goPrev} type="button">
        prev
      </button>
    </div>
  );
}

describe("useFindHighlights", () => {
  it("counts every occurrence in the article body", () => {
    render(<Harness active query="loop" />);
    // three "loop"s, first one active
    expect(screen.getByTestId("status").textContent).toBe("1/3");
  });

  it("advances and wraps with next/prev", () => {
    render(<Harness active query="loop" />);
    const status = screen.getByTestId("status");

    act(() => {
      fireEvent.click(screen.getByText("next"));
    });
    expect(status.textContent).toBe("2/3");

    act(() => {
      fireEvent.click(screen.getByText("prev"));
      fireEvent.click(screen.getByText("prev"));
    });
    // from index 1: prev → 0, prev → wraps to 2
    expect(status.textContent).toBe("3/3");
  });

  it("reports nothing when inactive or below the min length", () => {
    const { rerender } = render(<Harness active={false} query="loop" />);
    expect(screen.getByTestId("status").textContent).toBe("0");

    rerender(<Harness active query="x" />);
    expect(screen.getByTestId("status").textContent).toBe("0");
  });
});
