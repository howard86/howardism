import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { SearchProvider } from "@/components/search/search-provider";

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(document, "modelContext");
});

describe("SearchProvider WebMCP gate", () => {
  it("leaves WebMCP tools unmounted in an unsupported browser", async () => {
    render(<SearchProvider>content</SearchProvider>);

    await waitFor(() => {
      expect(screen.getAllByTestId("dynamic-component")).toHaveLength(1);
    });
  });

  it("mounts WebMCP tools after hydration in a supported browser", async () => {
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool: () => undefined },
    });

    render(<SearchProvider>content</SearchProvider>);

    await waitFor(() => {
      expect(screen.getAllByTestId("dynamic-component")).toHaveLength(2);
    });
  });
});
