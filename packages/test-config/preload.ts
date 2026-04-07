import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import React from "react";
import "@testing-library/jest-dom";

GlobalRegistrator.register();

// next/image and next/link depend on the Next.js runtime, so we stub them
// with plain HTML equivalents for component tests.
mock.module("next/image", () => ({
  default(props: Record<string, unknown>) {
    const { src, alt, width, height, fill, priority, loading, ...rest } = props;
    return React.createElement("img", { src, alt, width, height, ...rest });
  },
}));

mock.module("next/link", () => ({
  default(props: Record<string, unknown>) {
    const {
      children,
      href,
      legacyBehavior,
      passHref,
      prefetch,
      replace,
      scroll,
      shallow,
      locale,
      ...rest
    } = props;
    return React.createElement("a", { href, ...rest }, children);
  },
}));

mock.module("next/dynamic", () => ({
  default: () => {
    return function DynamicComponent() {
      return React.createElement("div", { "data-testid": "dynamic-component" });
    };
  },
}));
