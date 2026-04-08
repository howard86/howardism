import Link from "next/link";

import { InnerContainer, OuterContainer } from "@/app/(common)/Container";

import { NAV_SECTION_KEYS, NavSection } from "./constants";

export function Footer() {
  return (
    <footer className="mt-32">
      <OuterContainer>
        <div className="border-border border-t pt-10 pb-16">
          <InnerContainer>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <ul className="flex gap-6 font-medium text-foreground text-sm">
                {NAV_SECTION_KEYS.map((key) => (
                  <li key={key}>
                    <Link
                      className="link-hover link-neutral link"
                      href={NavSection[key]}
                    >
                      {key}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} Howard Tai. All rights
                reserved.
              </p>
            </div>
          </InnerContainer>
        </div>
      </OuterContainer>
    </footer>
  );
}
