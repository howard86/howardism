import { mock } from "bun:test";
import { createNextNavigationMock } from "./src/test-support/next-navigation-mock";
// Link the genuine async server-component modules now, before article-layout.test
// stubs them with mock.module, so article-rail / backlinks-disclosure suites can
// import the real implementations regardless of test-file order (see #780).
import "./src/test-support/real-article-modules";

// Mock next/navigation with all hooks before any test file registers a subset mock.
// Without this, Bun's ESM/CJS interop analysis runs on whichever test file's mock
// registers first (e.g. auth.test.ts only mocks notFound), locking the named-export
// set to that subset. Any subsequent file that imports { useRouter } then fails with
// "Export named 'useRouter' not found" even though its own mock.module provides it.
// Preloading with the full export set ensures Bun's analysis cache is populated
// correctly before parallel test files start overriding with narrower subsets.
mock.module("next/navigation", () => createNextNavigationMock());
