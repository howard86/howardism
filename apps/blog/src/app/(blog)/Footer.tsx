import Link from "next/link"

import { InnerContainer, OuterContainer } from "@/components/template/Container"
import { NAV_SECTION_KEYS, NavSection } from "@/constants/nav"

export function Footer() {
  return (
    <footer className="mt-32">
      <OuterContainer>
        <div className="border-t border-base-300 pb-16 pt-10">
          <InnerContainer>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <ul className="flex gap-6 text-sm font-medium text-base-content">
                {NAV_SECTION_KEYS.map((key) => (
                  <li key={key}>
                    <Link href={NavSection[key]} className="link-hover link-neutral link">
                      {key}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-base-content/60">
                &copy; {new Date().getFullYear()} Howard Tai. All rights reserved.
              </p>
            </div>
          </InnerContainer>
        </div>
      </OuterContainer>
    </footer>
  )
}
