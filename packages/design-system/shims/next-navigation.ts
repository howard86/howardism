// Stand-in for next/navigation outside Next.js: a static location, no router.
export const usePathname = (): string => "/";
export const useRouter = () => ({
  back: () => undefined,
  push: (_href: string) => undefined,
  refresh: () => undefined,
  replace: (_href: string) => undefined,
});
export const useSearchParams = () => new URLSearchParams();
