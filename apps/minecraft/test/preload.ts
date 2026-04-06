import { mock } from "bun:test";
import React from "react";

// Must run before test files import components that call next/dynamic at module
// evaluation time — a test-file-level mock.module would be too late.
mock.module("next/dynamic", () => ({
  default: () => {
    return function DynamicComponent() {
      return React.createElement("div", { "data-testid": "dynamic-component" });
    };
  },
}));
