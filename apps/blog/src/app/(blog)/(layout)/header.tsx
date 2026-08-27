"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import { cn } from "@howardism/ui/lib/utils";
import { Menu01Icon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/app/(common)/container";
import { useArticleNav } from "@/components/article-nav-context";
import { ArticleFind } from "@/components/find/article-find";
import { ReadingProgress } from "@/components/howardism/reading-progress";
import { ReviewBadge } from "@/components/review-badge";
import { SearchTrigger } from "@/components/search/search-trigger";
import { TocSheet } from "@/components/toc-sheet";
import { ReaderSettings } from "@/components/tweaks/reader-settings";
import { useTweaks } from "@/components/tweaks/tweaks-provider";
import useHasScrolled from "@/hooks/use-has-scrolled";

import { Avatar } from "./avatar";
import { FOOTER_NAV, NAV_SECTION_KEYS, NavSection } from "./constants";

function isRouteActive(pathname: string | null, href: string): boolean {
  return (
    pathname !== null &&
    (pathname === href || (href !== "/" && pathname.startsWith(href)))
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = isRouteActive(pathname, href);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className="rounded-full px-4 py-2 font-body font-medium text-[0.9rem] text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
      href={href}
    >
      {label}
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav
      aria-label="Primary"
      className="hidden gap-0.5 rounded-full border border-border bg-card/85 p-1.5 shadow-paper backdrop-blur-md md:flex"
    >
      {NAV_SECTION_KEYS.map((key) => (
        <NavLink href={NavSection[key]} key={key} label={key} />
      ))}
    </nav>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger
          aria-label="Menu"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <HugeiconsIcon className="size-[18px]" icon={Menu01Icon} />
        </SheetTrigger>
        <SheetContent
          className="mx-4 mt-4 rounded-3xl p-8"
          showCloseButton={false}
          side="top"
        >
          <SheetHeader className="flex-row items-center gap-3 p-0">
            <Avatar label="Home" size={36} />
            <div className="flex flex-col gap-px">
              <SheetTitle className="font-display font-medium text-[15px] text-foreground leading-none tracking-[-0.015em]">
                Howardism
              </SheetTitle>
              <span className="font-mono text-[10px] text-foreground-subtle uppercase leading-none tracking-[0.14em]">
                vol. 03 · quiet corner of the web
              </span>
            </div>
          </SheetHeader>
          <nav aria-label="Mobile primary" className="mt-6">
            <ul className="m-0 flex list-none flex-col gap-0 border-border border-t p-0">
              {FOOTER_NAV.map(({ label, href }) => (
                <li className="border-border border-b" key={label}>
                  <SheetClose asChild>
                    <Link
                      aria-current={
                        isRouteActive(pathname, href) ? "page" : undefined
                      }
                      className="flex min-h-12 items-center rounded-lg px-2 font-body text-[15px] text-foreground transition-colors aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
                      href={href}
                    >
                      {label}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>
          <span className="mt-6 block font-mono text-[10px] text-foreground-subtle tracking-[0.02em]">
            Set in Fraunces, Newsreader &amp; JetBrains Mono. The text is the
            work; the design is the chrome.
          </span>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ThemeToggle() {
  const { state, setMode } = useTweaks();
  const isDark = state.mode === "dark";
  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      onClick={() => setMode(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? (
        <HugeiconsIcon className="size-[18px]" icon={Sun03Icon} />
      ) : (
        <HugeiconsIcon className="size-[18px]" icon={Moon02Icon} />
      )}
    </button>
  );
}

/**
 * Persistent, context-aware top bar. Owns route nav + theme on every page, and
 * on article pages gains reader controls (TOC, reader settings) plus the
 * reading-progress bar rendered as its bottom edge. Condenses on scroll.
 */
export function SiteBar() {
  const isScrolled = useHasScrolled({ offsetPx: 80 });
  const isArticle = useArticleNav() !== null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-200",
        isScrolled && "border-border border-b bg-background/20 backdrop-blur-sm"
      )}
    >
      <Container className="relative w-full">
        <div
          className={cn(
            "flex items-center gap-2 transition-[padding] duration-200 sm:gap-3",
            isScrolled ? "py-2" : "py-4"
          )}
        >
          {/* Wordmark + avatar pill */}
          <div className="flex flex-1 items-center gap-3">
            <Avatar size={isScrolled ? 30 : 36} />
            <div className="flex flex-col gap-px">
              <span className="font-display font-medium text-[15px] text-foreground leading-none tracking-[-0.015em]">
                Howardism
              </span>
              {!isScrolled && (
                <span className="hidden font-mono text-[10px] text-foreground-subtle uppercase leading-none tracking-[0.14em] sm:block">
                  vol. 03 · quiet corner of the web
                </span>
              )}
            </div>
          </div>

          {/* Nav */}
          <DesktopNav />

          {/* Reader controls — article pages only. The TOC button is hidden at
              the rail breakpoint, where the sticky rail already shows the TOC. A
              hairline divider sets this reader cluster apart from the global
              search/theme/menu cluster. */}
          {isArticle && (
            <>
              <div className="flex items-center gap-0.5">
                <span className="inline-flex rail:hidden">
                  <TocSheet />
                </span>
                <ArticleFind />
                <ReaderSettings />
              </div>
              <span
                aria-hidden="true"
                className="h-5 w-px shrink-0 bg-border"
              />
            </>
          )}

          <ReviewBadge />
          <SearchTrigger />
          <ThemeToggle />
          <MobileNav />
        </div>
      </Container>

      {isArticle && <ReadingProgress />}
    </header>
  );
}
