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
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";
import { useArticleNav } from "@/components/article-nav-context";
import { ReadingProgress } from "@/components/howardism/reading-progress";
import { InternalLink } from "@/components/internal-link";
import { SearchTrigger } from "@/components/search/search-trigger";
import { TocSheet } from "@/components/toc-sheet";
import { ReaderSettings } from "@/components/tweaks/reader-settings";
import { useTweaks } from "@/components/tweaks/tweaks-provider";
import {
  formatMinutesLeft,
  useArticleReadingState,
} from "@/hooks/use-article-reading-state";
import useHasScrolled from "@/hooks/use-has-scrolled";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

import { Avatar } from "./avatar";
import { NAV_SECTION_KEYS, NavSection } from "./constants";

const LOCALE_PREFIX = /^\/zh-TW(?=\/|$)/;
const ZH_PREFIX = /^\/zh-TW/;

export function isRouteActive(pathname: string | null, href: string): boolean {
  const normalizedPath = pathname?.replace(LOCALE_PREFIX, "") || "/";
  return (
    pathname !== null &&
    (normalizedPath === href ||
      (href !== "/" && normalizedPath.startsWith(href)))
  );
}

export function languageHref(
  pathname: string | null,
  translationHref?: string
) {
  if (translationHref) {
    return translationHref;
  }
  if (pathname?.startsWith("/zh-TW")) {
    return pathname.replace(ZH_PREFIX, "") || "/";
  }
  return "/zh-TW/articles";
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
    <InternalLink
      aria-current={isActive ? "page" : undefined}
      className="rounded-full px-4 py-2 font-body font-medium text-[0.9rem] text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
      href={href}
    >
      {label}
    </InternalLink>
  );
}

function DesktopNav({ isCondensed }: { isCondensed: boolean }) {
  const pathname = usePathname();
  const articleNav = useArticleNav();
  const isChinese = pathname.startsWith("/zh-TW");
  const switchHref = languageHref(pathname, articleNav?.translationHref);

  // Condensed, the pill sheds its own surface: the bar already has one.
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "hidden gap-0.5 rounded-full md:flex",
        isCondensed ? "p-0" : "border border-border bg-card p-1.5 shadow-paper"
      )}
    >
      {NAV_SECTION_KEYS.map((key) => (
        <NavLink
          href={NavSection[key]}
          isActive={isRouteActive(pathname, NavSection[key])}
          key={key}
          label={key}
        />
      ))}
      <span aria-hidden="true" className="mx-1 my-2 h-5 w-px bg-border" />
      <fieldset
        aria-label="Language"
        className="m-0 flex min-w-0 items-center gap-1 border-0 p-0 px-2 font-mono text-xs"
      >
        {isChinese ? (
          <InternalLink
            aria-label="Read in English"
            className="rounded-full px-2 py-1 text-muted-foreground hover:text-foreground"
            href={switchHref}
            hrefLang="en"
            lang="en"
          >
            EN
          </InternalLink>
        ) : (
          <span
            aria-current="true"
            className="rounded-full bg-brand/10 px-2 py-1 text-brand"
          >
            EN
          </span>
        )}
        {isChinese ? (
          <span
            aria-current="true"
            className="rounded-full bg-brand/10 px-2 py-1 text-brand"
          >
            中文
          </span>
        ) : (
          <InternalLink
            aria-label="Read in Chinese"
            className="rounded-full px-2 py-1 text-muted-foreground hover:text-foreground"
            href={switchHref}
            hrefLang="zh-TW"
            lang="zh-TW"
          >
            中文
          </InternalLink>
        )}
      </fieldset>
    </nav>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const articleNav = useArticleNav();
  const isChinese = pathname.startsWith("/zh-TW");
  const switchHref = languageHref(pathname, articleNav?.translationHref);
  const englishHref = isChinese ? switchHref : pathname;
  const chineseHref = isChinese ? pathname : switchHref;

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
              </div>
            </div>
            <SheetClose className="rounded-full border border-border px-3 py-1.5 font-body text-sm">
              Close
            </SheetClose>
          </SheetHeader>
          <nav aria-label="Mobile primary" className="mt-6">
            <ul className="m-0 flex list-none flex-col gap-0 border-border border-t p-0">
              {NAV_SECTION_KEYS.map((label) => {
                const href = NavSection[label];
                return (
                  <li className="border-border border-b" key={label}>
                    <SheetClose asChild>
                      <InternalLink
                        aria-current={
                          isRouteActive(pathname, href) ? "page" : undefined
                        }
                        className="flex min-h-12 items-center justify-between rounded-lg px-2 font-body text-[15px] text-foreground transition-colors aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
                        href={href}
                      >
                        <span>{label}</span>
                      </InternalLink>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-5 border-border border-t pt-4">
            <div className="mb-2 font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.14em]">
              Language
            </div>
            <div className="inline-flex rounded-full border border-border p-1">
              {isChinese ? (
                <SheetClose asChild>
                  <InternalLink
                    className="rounded-full px-3 py-1.5 text-sm"
                    href={englishHref}
                    hrefLang="en"
                    lang="en"
                  >
                    English
                  </InternalLink>
                </SheetClose>
              ) : (
                <span
                  aria-current="true"
                  className="rounded-full bg-brand/10 px-3 py-1.5 text-brand text-sm"
                  lang="en"
                >
                  English
                </span>
              )}
              {isChinese ? (
                <span
                  aria-current="true"
                  className="rounded-full bg-brand/10 px-3 py-1.5 text-brand text-sm"
                  lang="zh-TW"
                >
                  繁體中文
                </span>
              ) : (
                <SheetClose asChild>
                  <InternalLink
                    className="rounded-full px-3 py-1.5 text-sm"
                    href={chineseHref}
                    hrefLang="zh-TW"
                    lang="zh-TW"
                  >
                    繁體中文
                  </InternalLink>
                </SheetClose>
              )}
            </div>
          </div>
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
  const { activeSection, progress } = useArticleReadingState(headings);

  const progressPercent = progress;

  return (
    <div className="fixed top-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-card shadow-lg">
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

function RunningHead({
  headings,
  readingTime,
  onOpenContents,
}: {
  headings: ArticleHeading[];
  readingTime?: number;
  onOpenContents: () => void;
}) {
  const { activeSection, progress } = useArticleReadingState(headings);
  const timeLeft = formatMinutesLeft(readingTime, progress / 100);
  if (headings.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="flex rail:hidden h-7 items-center justify-center gap-2 border-border border-t px-4 font-mono text-[11px] text-foreground-subtle"
      >
        {timeLeft ? <span className="tabular-nums">{timeLeft}</span> : null}
      </div>
    );
  }
  return (
    <button
      aria-label={activeSection ? `Contents: ${activeSection}` : "Contents"}
      className="flex rail:hidden h-7 w-full items-center justify-center gap-2 border-border border-t px-4 font-mono text-[11px] text-foreground-subtle"
      onClick={onOpenContents}
      type="button"
    >
      {activeSection ? null : <span>Contents</span>}
      {activeSection ? (
        <span className="max-w-[min(65vw,24rem)] truncate">
          {activeSection}
        </span>
      ) : null}
      {timeLeft ? (
        <>
          <span>·</span>
          <span className="shrink-0 tabular-nums">{timeLeft}</span>
        </>
      ) : null}
    </button>
  );
}

/**
 * Persistent, context-aware top bar. Owns route nav + theme on every page, and
 * on article pages gains reader controls (TOC, find, reader settings) plus the
 * reading-progress bar rendered as its bottom edge. Condenses to a 48px bar on
 * scroll; on article pages it slides away while scrolling down, leaving the
 * progress edge (and, below the rail breakpoint, the running head). In focus
 * mode the chrome collapses to the focus plate instead.
 */
export function SiteBar() {
  const isScrolled = useHasScrolled({ offsetPx: 80 });
  const articleNav = useArticleNav();
  const isArticle = articleNav !== null;
  const [contentsOpen, setContentsOpen] = useState(false);
  const { state, setFocusMode } = useTweaks();
  // focusMode is persisted, so scope it to article pages: elsewhere there is no
  // running head to carry EXIT, and collapsed chrome would be a dead end.
  const isFocusMode = isArticle && state.focusMode;
  const scrollDirection = useScrollDirection(isArticle, isFocusMode);
  const isHiddenOnScroll =
    isArticle && !isFocusMode && scrollDirection === "down";
  const exitFocusMode = useCallback(() => setFocusMode(false), [setFocusMode]);
  const openContents = useCallback(() => setContentsOpen(true), []);

  let chromeClass = "py-4 opacity-100 duration-200";
  if (isFocusMode) {
    chromeClass =
      "pointer-events-none h-0 overflow-hidden py-0 opacity-0 duration-[120ms]";
  } else if (isScrolled) {
    chromeClass = "h-12 py-0 opacity-100 duration-200";
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[top,color,background-color,border-color] duration-200 motion-reduce:transition-none",
        // Slide the 48px bar off: below the rail breakpoint the running head
        // stays; above it, a 3px sliver keeps the progress edge in view.
        isHiddenOnScroll &&
          "rail:top-[-45px] duration-[120ms] max-rail:top-[-48px]",
        // Opaque rather than translucent + backdrop-blur: the blur re-rasterised
        // the sticky bar on every scrolled frame.
        isScrolled && "border-border border-b bg-background"
      )}
    >
      <div className="relative mx-auto w-full max-w-wide px-gutter">
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-card focus:px-4 focus:py-2 focus:text-foreground focus:shadow-paper"
          href="#main-content"
        >
          Skip to content
        </a>
        <div
          className={cn(
            "flex items-center gap-2 transition-all motion-reduce:transition-none sm:gap-3",
            chromeClass,
            isHiddenOnScroll && "pointer-events-none opacity-0 duration-[120ms]"
          )}
        >
          {/* Wordmark + avatar pill */}
          <div className="flex flex-1 items-center gap-3">
            <Avatar size={isScrolled ? 30 : 36} />
            <div
              className={cn(
                "flex flex-col gap-px",
                isArticle && "hidden sm:flex"
              )}
            >
              <span className="font-display font-medium text-[15px] text-foreground leading-none tracking-[-0.015em]">
                Howardism
              </span>
            </div>
          </div>

          {/* Nav */}
          <DesktopNav isCondensed={isScrolled} />

          <SearchTrigger />
          <ReaderSettings />
          <MobileNav />
        </div>
      </div>

      {isArticle && !isFocusMode && (
        <RunningHead
          headings={articleNav.headings}
          onOpenContents={openContents}
          readingTime={articleNav.readingTime}
        />
      )}

      {isArticle && (
        <TocSheet onOpenChange={setContentsOpen} open={contentsOpen} />
      )}

      {isArticle && <ReadingProgress headings={articleNav.headings} />}

      {isFocusMode ? (
        <FocusPlate headings={articleNav.headings} onExit={exitFocusMode} />
      ) : null}
    </header>
  );
}
