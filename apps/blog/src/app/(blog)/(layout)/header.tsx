"use client";

import { Badge } from "@howardism/ui/components/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/app/(common)/container";
import { MoonIcon, SunIcon } from "@/app/(common)/icons";
import { useArticleNav } from "@/components/article-nav-context";
import { ArticleFind } from "@/components/find/article-find";
import { ReadingProgress } from "@/components/howardism/reading-progress";
import { SearchTrigger } from "@/components/search/search-trigger";
import { TocSheet } from "@/components/toc-sheet";
import { ReaderSettings } from "@/components/tweaks/reader-settings";
import { useTweaks } from "@/components/tweaks/tweaks-provider";
import useHasScrolled from "@/hooks/use-has-scrolled";

import { Avatar } from "./avatar";
import { NAV_SECTION_KEYS, NavSection } from "./constants";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive =
    pathname !== null &&
    (pathname === href || (href !== "/" && pathname.startsWith(href)));

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
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button">
            <Badge variant="chip">Menu</Badge>
          </button>
        </SheetTrigger>
        <SheetContent
          className="mx-4 mt-4 rounded-3xl p-8"
          showCloseButton={false}
          side="top"
        >
          <SheetHeader className="p-0">
            <SheetTitle className="font-medium font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
              Navigation
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Mobile primary" className="mt-6">
            <ul className="m-0 flex list-none flex-col gap-0 border-border border-t p-0">
              {NAV_SECTION_KEYS.map((key) => (
                <li className="border-border border-b" key={key}>
                  <Link
                    className="block py-3 font-body text-[15px] text-foreground"
                    href={NavSection[key]}
                  >
                    {key}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
        <SunIcon className="size-[18px] fill-none stroke-current" />
      ) : (
        <MoonIcon className="size-[18px] fill-current" />
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
              the rail breakpoint, where the sticky rail already shows the TOC. */}
          {isArticle && (
            <div className="flex items-center gap-0.5">
              <span className="inline-flex rail:hidden">
                <TocSheet />
              </span>
              <ArticleFind />
              <ReaderSettings />
            </div>
          )}

          <SearchTrigger />
          <ThemeToggle />
          <MobileNav />
        </div>
      </Container>

      {isArticle && <ReadingProgress />}
    </header>
  );
}
