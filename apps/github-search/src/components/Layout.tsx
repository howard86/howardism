import { RouteLink } from "@howardism/components-common";
import { useRouter } from "next/router";
import type { ChildrenProps } from "react";

export default function Layout({ children }: ChildrenProps) {
  const router = useRouter();
  const animateKey = router.asPath.includes("?")
    ? router.pathname
    : router.asPath;

  return (
    <div className="min-h-[80vh]">
      <nav className="flex justify-between bg-teal-600 py-2 font-bold text-white md:py-4">
        <RouteLink className="ml-2 md:ml-4" href="/">
          Home
        </RouteLink>
      </nav>
      <main
        className="flex h-full w-full max-w-full animate-fade-in flex-col items-center p-2 md:p-4 lg:p-8"
        key={animateKey}
      >
        {children}
      </main>
    </div>
  );
}
