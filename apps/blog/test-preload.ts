import { mock } from "bun:test";

// Mock next/navigation with all hooks before any test file registers a subset mock.
// Without this, Bun's ESM/CJS interop analysis runs on whichever test file's mock
// registers first (e.g. auth.test.ts only mocks notFound), locking the named-export
// set to that subset. Any subsequent file that imports { useRouter } then fails with
// "Export named 'useRouter' not found" even though its own mock.module provides it.
// Preloading with the full export set ensures Bun's analysis cache is populated
// correctly before parallel test files start overriding with narrower subsets.
mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: () => undefined,
    replace: () => undefined,
    back: () => undefined,
    prefetch: () => undefined,
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: (): never => {
    throw Object.assign(new Error("NEXT_NOT_FOUND"), {
      digest: "NEXT_NOT_FOUND",
    });
  },
  redirect: (): never => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT",
    });
  },
  permanentRedirect: (): never => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT",
    });
  },
}));
