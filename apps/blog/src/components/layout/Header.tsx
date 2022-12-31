import clsx from "clsx"
import Link from "next/link"

import { SECTION_IDS } from "@/constants/nav"
import useHasScrolled from "@/hooks/useHasScrolled"
import useScrollSpy from "@/hooks/useScrollSpy"

import Logo from "../icons/Logo"

import { Container } from "./Container"
import DesktopNavigation from "./DesktopNavigation"
import MobileNavigation from "./MobileNavigation"
import ModeToggle from "./ModeToggle"

export const HEADER_OFFSET = 80

export default function Header1() {
  const isScrolled = useHasScrolled({ offsetPx: HEADER_OFFSET, throttleMs: 300 })
  const activeSectionId = useScrollSpy({ sectionIds: SECTION_IDS, offsetPx: HEADER_OFFSET })

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 w-full transition-all",
        isScrolled ? "py-3 backdrop-blur-sm" : "py-6 md:py-8"
      )}
    >
      <Container>
        <div className="flex items-center gap-4">
          <Link className="flex-1" href="/">
            <Logo
              className="h-12 w-12 rounded-full p-1 text-black dark:bg-white"
              filter="drop-shadow(0.3px 0.3px 0.4px rgb(0 0 0 / 0.4)) drop-shadow(0.6px 0.6px 1px rgb(0 0 0 / 0.2))"
            />
          </Link>
          <DesktopNavigation activeSectionId={activeSectionId} className="hidden md:block" />
          <MobileNavigation activeSectionId={activeSectionId} className="md:hidden" />
          <div className="flex justify-end md:flex-1">
            <ModeToggle />
          </div>
        </div>
      </Container>
    </header>
  )
}
