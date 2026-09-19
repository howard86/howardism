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
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";
import { Container } from "@/app/(common)/container";
import { useArticleNav } from "@/components/article-nav-context";
import { ArticleFind } from "@/components/find/article-find";
import { ReadingProgress } from "@/components/howardism/reading-progress";
import { SearchTrigger } from "@/components/search/search-trigger";
import { TocSheet } from "@/components/toc-sheet";
import { ReaderSettings } from "@/components/tweaks/reader-settings";
import { useTweaks } from "@/components/tweaks/tweaks-provider";
import {
  findActiveHeadingIndex,
  subscribeToArticleScroll,
} from "@/hooks/use-article-scroll";
import useHasScrolled from "@/hooks/use-has-scrolled";

import { Avatar } from "./avatar";
import { FOOTER_NAV, NAV_SECTION_KEYS, NavSection } from "./constants";

function isRouteActive(pathname: string | null, href: string): boolean {
  return (
    pathname !== null &&
    (pathname === href || (href !== "/" && pathname.startsWith(href)))
  );
}

function NavLink({
  href,
  isActive,
  label,
}: {
  href: string;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className="rounded-full px-4 py-2 font-body font-medium text-[0.9rem] text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
      href={href}
      prefetch={false}
    >
      {label}
    </Link>
  );
}

function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden gap-0.5 rounded-full border border-border bg-card/85 p-1.5 shadow-paper backdrop-blur-md md:flex"
    >
      {NAV_SECTION_KEYS.map((key) => (
        <NavLink
          href={NavSection[key]}
          isActive={isRouteActive(pathname, NavSection[key])}
          key={key}
          label={key}
        />
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { state, setMode } = useTweaks();
  const isDark = state.mode === "dark";
  const toggleMode = useCallback(
    () => setMode(isDark ? "light" : "dark"),
    [isDark, setMode]
  );
  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      onClick={toggleMode}
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

const PLATE_ANNOTATIONS: Record<string, string> = {
  Home: "Masthead · 00",
  Articles: "Plate I · 01",
  Questions: "Plate III · 03",
  Shelf: "Plate IV · 04",
  RSS: "Feed",
};

const QUICK_LINKS = [
  { label: "Questions", href: "/questions" },
  { label: "Shelf", href: "/shelf" },
  { label: "繁體中文", href: "/zh-TW/articles" },
  { label: "RSS Feed", href: "/rss/feed.xml" },
];

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
          <SheetHeader className="flex-row items-center justify-between gap-3 p-0">
            <div className="flex items-center gap-3">
              <Avatar label="Home" size={36} />
              <div className="flex flex-col gap-px">
                <SheetTitle className="font-display font-medium text-[15px] text-foreground leading-none tracking-[-0.015em]">
                  Howardism
                </SheetTitle>
                <span className="font-mono text-[10px] text-foreground-subtle uppercase leading-none tracking-[0.14em]">
                  vol. 03 · quiet corner of the web
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
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
                      className="flex min-h-12 items-center justify-between rounded-lg px-2 font-body text-[15px] text-foreground transition-colors aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
                      href={href}
                    >
                      <span>{label}</span>
                      {PLATE_ANNOTATIONS[label] ? (
                        <span className="font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.14em]">
                          {PLATE_ANNOTATIONS[label]}
                        </span>
                      ) : null}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-5 border-border border-t pt-4">
            <div className="mb-2 font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.14em]">
              Quick Navigation
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_LINKS.map(({ label, href }) => (
                <SheetClose asChild key={label}>
                  <Link
                    aria-current={
                      isRouteActive(pathname, href) ? "page" : undefined
                    }
                    className="rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground aria-[current=page]:border-brand/30 aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
                    href={href}
                  >
                    {label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>
          <span className="mt-5 block font-mono text-[10px] text-foreground-subtle tracking-[0.02em]">
            Set in Fraunces, Newsreader &amp; JetBrains Mono. The text is the
            work; the design is the chrome.
          </span>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FocusPlate({
  headings,
  onExit,
}: {
  headings: ArticleHeading[];
  onExit: () => void;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const h2Headings = useMemo(
    () => headings.filter((h) => h.depth === 2),
    [headings]
  );
  const h2Ids = useMemo(() => h2Headings.map((h) => h.id), [h2Headings]);
  const textById = useMemo(
    () => new Map(h2Headings.map((h) => [h.id, h.text])),
    [h2Headings]
  );

  useEffect(
    () =>
      subscribeToArticleScroll(h2Ids, (frame) => {
        if (!frame) {
          setProgress(0);
          setActiveSection(null);
          return;
        }
        setProgress(frame.progress);
        // Cached, ascending offsets — a binary search instead of a rect sweep.
        const index = findActiveHeadingIndex(frame);
        setActiveSection(
          index < 0 ? null : (textById.get(frame.headings[index].id) ?? null)
        );
      }),
    [h2Ids, textById]
  );

  const progressPercent = Math.round(progress * 100);

  return (
    <div className="fixed top-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-card/95 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 px-5 py-2.5">
        <div
          aria-hidden="true"
          className="flex items-center gap-2 font-mono text-[11px] text-foreground-subtle tracking-[0.02em]"
        >
          <span className="max-w-[200px] truncate sm:max-w-[300px]">
            Reading
          </span>
          {activeSection ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="max-w-[150px] truncate sm:max-w-[200px]">
                {activeSection}
              </span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{progressPercent}%</span>
        </div>
        <button
          aria-label="Exit focus mode"
          className="flex items-center justify-center rounded-full px-2.5 py-1 font-medium font-mono text-[10px] text-foreground-subtle transition-colors duration-[120ms] hover:bg-accent hover:text-foreground motion-reduce:transition-none"
          onClick={onExit}
          title="Exit focus mode"
          type="button"
        >
          EXIT
        </button>
      </div>
    </div>
  );
}

/**
 * Persistent, context-aware top bar. Owns route nav + theme on every page, and
 * on article pages gains reader controls (TOC, reader settings, focus mode)
 * plus the reading-progress bar rendered as its bottom edge. Condenses on
 * scroll; in focus mode the chrome collapses to the running head instead.
 */
export function SiteBar() {
  const isScrolled = useHasScrolled({ offsetPx: 80 });
  const articleNav = useArticleNav();
  const isArticle = articleNav !== null;
  const { state, setFocusMode } = useTweaks();
  // focusMode is persisted, so scope it to article pages: elsewhere there is no
  // running head to carry EXIT, and collapsed chrome would be a dead end.
  const isFocusMode = isArticle && state.focusMode;
  const enterFocusMode = useCallback(() => setFocusMode(true), [setFocusMode]);
  const exitFocusMode = useCallback(() => setFocusMode(false), [setFocusMode]);

  let chromeClass = "py-4 opacity-100 duration-200";
  if (isFocusMode) {
    chromeClass =
      "pointer-events-none h-0 overflow-hidden py-0 opacity-0 duration-[120ms]";
  } else if (isScrolled) {
    chromeClass = "py-2 opacity-100 duration-200";
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-200 motion-reduce:transition-none",
        isScrolled && "border-border border-b bg-background/20 backdrop-blur-sm"
      )}
    >
      <Container className="relative w-full">
        <div
          className={cn(
            "flex items-center gap-2 transition-all motion-reduce:transition-none sm:gap-3",
            chromeClass
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
                {!state.focusMode && (
                  <button
                    aria-label="Enter focus mode"
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={enterFocusMode}
                    title="Focus mode"
                    type="button"
                  >
                    <span className="font-medium font-mono text-[10px]">
                      FOCUS
                    </span>
                  </button>
                )}
              </div>
              <span
                aria-hidden="true"
                className="h-5 w-px shrink-0 bg-border"
              />
            </>
          )}

          <SearchTrigger />
          <ThemeToggle />
          <MobileNav />
        </div>
      </Container>

      {isArticle && <ReadingProgress headings={articleNav.headings} />}

      {isFocusMode ? (
        <FocusPlate headings={articleNav.headings} onExit={exitFocusMode} />
      ) : null}
    </header>
  );
}
