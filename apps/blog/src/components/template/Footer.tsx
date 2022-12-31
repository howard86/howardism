import Link from "next/link";

import { NAV_SECTION_KEYS, NavSection } from "@/constants/nav";

import { InnerContainer, OuterContainer } from "./Container";

export function Footer() {
  return (
    <footer className="mt-32">
      <OuterContainer>
        <div className="border-t border-zinc-100 pt-10 pb-16 dark:border-zinc-700/40">
          <InnerContainer>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex gap-6 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {NAV_SECTION_KEYS.map((key) => (
                  <Link key={key} href={NavSection[key]} className="link">
                    {key}
                  </Link>
                ))}
              </div>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                &copy; {new Date().getFullYear()} Howard Tai. All rights reserved.
              </p>
            </div>
          </InnerContainer>
        </div>
      </OuterContainer>
    </footer>
  );
}
