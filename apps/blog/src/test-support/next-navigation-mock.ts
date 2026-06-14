interface NextNavigationMock {
  notFound: () => never;
  permanentRedirect: () => never;
  redirect: () => never;
  useParams: () => Record<string, string>;
  usePathname: () => string;
  useRouter: () => {
    push: (href: string) => void;
    replace: () => void;
    back: () => void;
    prefetch: () => void;
  };
  useSearchParams: () => URLSearchParams;
}

// Canonical next/navigation mock with the full named-export set. Every
// `mock.module("next/navigation", ...)` call — the preload and any test that
// needs custom behaviour — must go through this so the module's export shape
// stays complete. Bun locks the named-export set to whichever mock factory was
// analysed when a consumer is linked; a factory that omits, say, `usePathname`
// makes later `import { usePathname }` fail with "Export named ... not found".
// Passing overrides keeps the full shape while swapping individual hooks.
export function createNextNavigationMock(
  overrides: Partial<NextNavigationMock> = {}
): NextNavigationMock {
  return {
    useRouter: () => ({
      push: () => undefined,
      replace: () => undefined,
      back: () => undefined,
      prefetch: () => undefined,
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    notFound: () => {
      throw Object.assign(new Error("NEXT_NOT_FOUND"), {
        digest: "NEXT_NOT_FOUND",
      });
    },
    redirect: () => {
      throw Object.assign(new Error("NEXT_REDIRECT"), {
        digest: "NEXT_REDIRECT",
      });
    },
    permanentRedirect: () => {
      throw Object.assign(new Error("NEXT_REDIRECT"), {
        digest: "NEXT_REDIRECT",
      });
    },
    ...overrides,
  };
}
