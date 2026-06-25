import { useSyncExternalStore } from "react";

/**
 * Client-only learning progress: MCQ mastery + SM-2 flashcard scheduling, kept
 * in localStorage so the whole learning layer stays static (no accounts, no DB).
 * Exposed through a tiny external store so the in-article quiz, the skill tree,
 * and the review screen all stay in sync within a tab and across tabs.
 */

const STORAGE_KEY = "howardism:learning:v1";

/** Fraction of MCQs a reader must get right for a concept to count as mastered. */
export const MASTERY_PASS_RATIO = 0.8;

/** Hubs a reader must master before the rest of a domain's tree unlocks. */
export const HUBS_REQUIRED_TO_UNLOCK = 2;

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;
const START_EASE = 2.5;

export interface CardState {
  dueAt: number;
  ease: number;
  intervalDays: number;
  lapses: number;
  reps: number;
}

export interface ConceptState {
  cards: Record<string, CardState>;
  masteredAt?: number;
  mcqBest?: number;
}

export interface LearningState {
  concepts: Record<string, ConceptState>;
  version: 1;
}

/** Self-grade buttons map to SM-2 quality scores; < 3 is a lapse. */
export type ReviewGrade = "again" | "hard" | "good" | "easy";

const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
};

const EMPTY_STATE: LearningState = { version: 1, concepts: {} };

const listeners = new Set<() => void>();
let cache: LearningState | null = null;

const isBrowser = (): boolean => typeof window !== "undefined";

function readFromStorage(): LearningState {
  if (!isBrowser()) {
    return EMPTY_STATE;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATE;
    }
    const parsed = JSON.parse(raw) as LearningState;
    if (parsed.version !== 1 || typeof parsed.concepts !== "object") {
      return EMPTY_STATE;
    }
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

function getSnapshot(): LearningState {
  if (cache === null) {
    cache = readFromStorage();
  }
  return cache;
}

function getServerSnapshot(): LearningState {
  return EMPTY_STATE;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  if (isBrowser() && listeners.size === 1) {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    listeners.delete(onChange);
    if (isBrowser() && listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key === STORAGE_KEY) {
    cache = null;
    for (const listener of listeners) {
      listener();
    }
  }
}

function commit(next: LearningState): void {
  cache = next;
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  for (const listener of listeners) {
    listener();
  }
}

function conceptOf(state: LearningState, slug: string): ConceptState {
  return state.concepts[slug] ?? { cards: {} };
}

/** React binding — re-renders when any learning state changes. */
export function useLearningState(): LearningState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function isMastered(state: LearningState, slug: string): boolean {
  return state.concepts[slug]?.masteredAt !== undefined;
}

/**
 * Record an MCQ attempt. Stores the best score and, once it clears the pass
 * ratio, marks the concept mastered and seeds its flashcards into the scheduler
 * (due immediately) so the first review is offered right away.
 */
export function recordMcqResult(
  slug: string,
  correct: number,
  total: number,
  cardFronts: string[],
  now: number = Date.now()
): void {
  const state = getSnapshot();
  const prev = conceptOf(state, slug);
  const ratio = total > 0 ? correct / total : 0;
  const passed = ratio >= MASTERY_PASS_RATIO;
  const cards = { ...prev.cards };
  if (passed) {
    for (const front of cardFronts) {
      cards[front] ??= {
        dueAt: now,
        ease: START_EASE,
        intervalDays: 0,
        lapses: 0,
        reps: 0,
      };
    }
  }
  const nextConcept: ConceptState = {
    cards,
    masteredAt: passed ? (prev.masteredAt ?? now) : prev.masteredAt,
    mcqBest: Math.max(prev.mcqBest ?? 0, ratio),
  };
  commit({
    ...state,
    concepts: { ...state.concepts, [slug]: nextConcept },
  });
}

function nextCardState(
  card: CardState,
  grade: ReviewGrade,
  now: number
): CardState {
  const quality = GRADE_QUALITY[grade];
  if (quality < 3) {
    return {
      ...card,
      dueAt: now + DAY_MS,
      intervalDays: 1,
      lapses: card.lapses + 1,
      reps: 0,
    };
  }
  const reps = card.reps + 1;
  let intervalDays: number;
  if (reps === 1) {
    intervalDays = 1;
  } else if (reps === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(card.intervalDays * card.ease);
  }
  const ease = Math.max(
    MIN_EASE,
    card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  return {
    dueAt: now + intervalDays * DAY_MS,
    ease,
    intervalDays,
    lapses: card.lapses,
    reps,
  };
}

/** Apply an SM-2 grade to one card of one concept. No-op if unknown. */
export function gradeCard(
  slug: string,
  front: string,
  grade: ReviewGrade,
  now: number = Date.now()
): void {
  const state = getSnapshot();
  const concept = state.concepts[slug];
  const card = concept?.cards[front];
  if (!card) {
    return;
  }
  const nextConcept: ConceptState = {
    ...concept,
    cards: { ...concept.cards, [front]: nextCardState(card, grade, now) },
  };
  commit({
    ...state,
    concepts: { ...state.concepts, [slug]: nextConcept },
  });
}

export interface DueCardRef {
  front: string;
  slug: string;
}

/** Scheduled cards whose dueAt has passed, oldest-due first. */
export function getDueCards(
  state: LearningState,
  now: number = Date.now()
): DueCardRef[] {
  const due: { front: string; slug: string; dueAt: number }[] = [];
  for (const [slug, concept] of Object.entries(state.concepts)) {
    for (const [front, card] of Object.entries(concept.cards)) {
      if (card.dueAt <= now) {
        due.push({ slug, front, dueAt: card.dueAt });
      }
    }
  }
  due.sort((a, b) => a.dueAt - b.dueAt);
  return due.map(({ slug, front }) => ({ slug, front }));
}

export function countDueCards(
  state: LearningState,
  now: number = Date.now()
): number {
  return getDueCards(state, now).length;
}
