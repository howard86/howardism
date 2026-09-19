/**
 * Deterministic proxy for the per-scroll-tick cost of the article chrome.
 *
 * No browser profiler is available under `bun test`, so this counts the two
 * things that dominate a real scroll frame: layout reads (`getBoundingClientRect`
 * plus the `getElementById` / `querySelector` lookups that precede them, each of
 * which forces synchronous layout in a real browser once the progress bar has
 * dirtied it) and React commits. Both are exact integers, so the before/after
 * pair is reproducible rather than timing noise.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Profiler, useEffect, useMemo, useState } from "react";

import { ResumeReading } from "@/app/(blog)/articles/[slug]/resume-reading";
import type { ArticleHeading } from "@/app/(blog)/articles/service";
import { ReadingProgress } from "@/components/howardism/reading-progress";
import {
  findActiveHeadingIndex,
  subscribeToArticleScroll,
} from "@/hooks/use-article-scroll";
import { resetReadingStoreCache } from "@/lib/reading-store";

const HEADING_COUNT = 15;
const HEADING_GAP_PX = 180;
const ARTICLE_HEIGHT = 6000;
const VIEWPORT_HEIGHT = 900;
const SCROLL_TICKS = 40;
const SCROLL_STEP_PX = 120;
/** Past the 50 ms scroll throttle, so every dispatch lands as its own tick. */
const TICK_WAIT_MS = 60;

const counters = {
  getElementById: 0,
  querySelector: 0,
  rect: 0,
};

const nativeGetElementById = document.getElementById.bind(document);
const nativeQuerySelector = document.querySelector.bind(document);

function resetCounters(): void {
  counters.getElementById = 0;
  counters.querySelector = 0;
  counters.rect = 0;
}

function layoutReads(): number {
  return counters.getElementById + counters.querySelector + counters.rect;
}

function instrumentDocument(): void {
  document.getElementById = (id: string) => {
    counters.getElementById += 1;
    return nativeGetElementById(id);
  };
  document.querySelector = ((selector: string) => {
    counters.querySelector += 1;
    return nativeQuerySelector(selector);
  }) as typeof document.querySelector;
}

function restoreDocument(): void {
  document.getElementById = nativeGetElementById;
  document.querySelector = nativeQuerySelector;
}

/** Un-counted box metrics, for the fixture's own bookkeeping. */
const rawRects = new WeakMap<Element, () => DOMRect>();

function rawRect(el: Element): DOMRect {
  return rawRects.get(el)?.() ?? ({ top: 0 } as DOMRect);
}

/** happy-dom reports 0 for every box metric, so the fixture supplies them. */
function countedRect(el: Element, documentTop: number): void {
  rawRects.set(el, () => ({ top: documentTop - window.scrollY }) as DOMRect);
  el.getBoundingClientRect = () => {
    counters.rect += 1;
    return rawRect(el);
  };
}

/**
 * happy-dom ships an IntersectionObserver that never fires, so the scroll-spy
 * cost is invisible without one. This stands in for the real thing: it
 * recomputes intersection against the same rootMargin band on every scroll and
 * delivers only the targets whose state changed, exactly as a browser does. Its
 * own measurements are deliberately un-counted — a browser computes them at the
 * frame boundary, off the caller's layout path — so what the counters see is
 * only what the observer's *callback* goes on to read.
 */
function installFakeIntersectionObserver(): () => void {
  const native = globalThis.IntersectionObserver;

  class ScrollDrivenObserver {
    readonly root = null;
    readonly rootMargin: string;
    readonly thresholds = [0];
    private readonly targets = new Set<Element>();
    private readonly state = new Map<Element, boolean>();
    private readonly topMargin: number;
    private readonly callback: IntersectionObserverCallback;

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit
    ) {
      this.callback = callback;
      this.rootMargin = options?.rootMargin ?? "0px";
      this.topMargin = Number.parseFloat(this.rootMargin.replace("-", "")) || 0;
      window.addEventListener("scroll", this.onScroll);
    }

    private readonly onScroll = () => {
      const bottom = window.innerHeight * 0.35;
      const entries: IntersectionObserverEntry[] = [];
      for (const target of this.targets) {
        const rect = rawRect(target);
        const isIntersecting = rect.top >= this.topMargin && rect.top <= bottom;
        if (this.state.get(target) === isIntersecting) {
          continue;
        }
        this.state.set(target, isIntersecting);
        entries.push({
          boundingClientRect: rect,
          isIntersecting,
          target,
        } as IntersectionObserverEntry);
      }
      if (entries.length > 0) {
        this.callback(entries, this as unknown as IntersectionObserver);
      }
    };

    observe(target: Element): void {
      this.targets.add(target);
      this.state.set(target, false);
    }

    unobserve(target: Element): void {
      this.targets.delete(target);
    }

    disconnect(): void {
      this.targets.clear();
      window.removeEventListener("scroll", this.onScroll);
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    ScrollDrivenObserver as unknown as typeof IntersectionObserver;
  return () => {
    globalThis.IntersectionObserver = native;
  };
}

const headings: ArticleHeading[] = Array.from(
  { length: HEADING_COUNT },
  (_, index) => ({
    depth: 2 as const,
    id: `h-${index}`,
    text: `Section ${index}`,
  })
);

function articleInDom(): void {
  const article = document.createElement("article");
  Object.defineProperty(article, "offsetHeight", { value: ARTICLE_HEIGHT });
  countedRect(article, 0);
  for (const [index, heading] of headings.entries()) {
    const el = document.createElement("h2");
    el.id = heading.id;
    countedRect(el, (index + 1) * HEADING_GAP_PX);
    article.appendChild(el);
  }
  document.body.appendChild(article);
}

async function scrollBurst(): Promise<void> {
  for (let tick = 1; tick <= SCROLL_TICKS; tick += 1) {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: tick * SCROLL_STEP_PX,
    });
    await act(async () => {
      fireEvent.scroll(window);
      await new Promise((resolve) => setTimeout(resolve, TICK_WAIT_MS));
    });
  }
}

/**
 * Mirrors the per-tick work `FocusPlate` does in `header.tsx`, without pulling
 * the whole header (and its next/navigation surface) into the measurement.
 */
function FocusPlateStandIn({ items }: { items: ArticleHeading[] }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const h2Headings = useMemo(() => items.filter((h) => h.depth === 2), [items]);
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
        const index = findActiveHeadingIndex(frame);
        setActiveSection(
          index < 0 ? null : (textById.get(frame.headings[index].id) ?? null)
        );
      }),
    [h2Ids, textById]
  );

  return (
    <div>
      {activeSection} {Math.round(progress * 100)}
    </div>
  );
}

function report(label: string, reads: number, commits: number): void {
  // Only the exact integer counters are reported: React's `actualDuration`
  // under happy-dom varied by ~40% run to run, so it is not a usable gate.
  process.stdout.write(
    `${label.padEnd(30)} layout reads/tick ${(reads / SCROLL_TICKS)
      .toFixed(2)
      .padStart(6)}   commits/tick ${(commits / SCROLL_TICKS)
      .toFixed(2)
      .padStart(5)}\n`
  );
}

afterEach(() => {
  cleanup();
  restoreDocument();
  document.body.innerHTML = "";
  localStorage.clear();
  // ResumeReading persists into the reading store's module-level cache as well.
  resetReadingStoreCache();
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

describe("article scroll chrome cost per tick", () => {
  it("keeps the progress bar off the layout path while scrolling", async () => {
    window.innerHeight = VIEWPORT_HEIGHT;
    articleInDom();
    instrumentDocument();

    let commits = 0;
    render(
      <Profiler
        id="reading-progress"
        onRender={() => {
          commits += 1;
        }}
      >
        <ReadingProgress headings={headings} />
      </Profiler>
    );

    resetCounters();
    commits = 0;
    await scrollBurst();

    report("ReadingProgress", layoutReads(), commits);
    // The gate: a scroll tick reads window.scrollY and nothing that forces
    // layout. Geometry is measured on mount and on resize only.
    expect(layoutReads()).toBe(0);
  });

  it("keeps the progress bar and focus plate off the layout path", async () => {
    window.innerHeight = VIEWPORT_HEIGHT;
    articleInDom();
    instrumentDocument();

    let commits = 0;
    render(
      <Profiler
        id="article-chrome"
        onRender={() => {
          commits += 1;
        }}
      >
        <ReadingProgress headings={headings} />
        <FocusPlateStandIn items={headings} />
      </Profiler>
    );

    resetCounters();
    commits = 0;
    await scrollBurst();

    report("ReadingProgress + FocusPlate", layoutReads(), commits);
    // Two subscribers no longer means two independent measurement passes.
    expect(layoutReads()).toBe(0);
  });

  it("keeps ResumeReading off the render path while scrolling", async () => {
    window.innerHeight = VIEWPORT_HEIGHT;
    articleInDom();
    instrumentDocument();

    const restoreObserver = installFakeIntersectionObserver();
    let renders = 0;
    render(
      <Profiler
        id="resume-reading"
        onRender={() => {
          renders += 1;
        }}
      >
        <ResumeReading headings={headings} slug="perf-slug" />
      </Profiler>
    );

    resetCounters();
    renders = 0;
    await scrollBurst();

    restoreObserver();
    report("ResumeReading", layoutReads(), renders);
  });
});
