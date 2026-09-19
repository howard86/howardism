import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { SearchProvider } from "@/components/search/search-provider";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(document, "modelContext");
});

// Both lazy children are `next/dynamic`, which the test preload renders as a
// `dynamic-component` stub. Neither mounts on load: the palette waits for the
// first open, and the WebMCP tools wait for a `document.modelContext`.
describe("SearchProvider lazy children", () => {
  it("mounts neither the palette nor the WebMCP tools in an unsupported browser", async () => {
    render(<SearchProvider>content</SearchProvider>);

    await waitFor(() => {
      expect(screen.getByText("content")).toBeDefined();
    });
    expect(screen.queryAllByTestId("dynamic-component")).toHaveLength(0);
  });

  it("mounts the WebMCP tools after hydration when modelContext exists", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: () => undefined },
    });

    render(<SearchProvider>content</SearchProvider>);

    await waitFor(() => {
      expect(screen.getAllByTestId("dynamic-component")).toHaveLength(1);
    });
  });
});
