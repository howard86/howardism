"use client";

import type { QuizConcept } from "@howardism/article-contract/manifests/quiz";
import { cn } from "@howardism/ui/lib/utils";
import Link from "next/link";

import {
  HUBS_REQUIRED_TO_UNLOCK,
  isMastered,
  useLearningState,
} from "@/utils/learning-state";

interface SkillTreeProps {
  color: string;
  concepts: QuizConcept[];
}

type NodeStatus = "mastered" | "unlocked" | "locked";

function ConceptNode({
  concept,
  status,
  color,
}: {
  color: string;
  concept: QuizConcept;
  status: NodeStatus;
}) {
  const label = (
    <span className="flex items-baseline justify-between gap-3">
      <span className="font-display font-medium text-[16px] leading-snug">
        {concept.title}
      </span>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]">
        {status === "mastered" && "✓ mastered"}
        {status === "unlocked" && "open"}
        {status === "locked" && "🔒 locked"}
      </span>
    </span>
  );

  const baseClass = "block rounded-sm border px-4 py-3 transition-colors";

  if (status === "locked") {
    return (
      <div
        aria-disabled="true"
        className={cn(
          baseClass,
          "border-border border-dashed text-foreground-subtle"
        )}
      >
        {label}
        <span className="mt-1 block font-body text-[13px] text-foreground-subtle">
          Master {HUBS_REQUIRED_TO_UNLOCK} hub concepts to unlock.
        </span>
      </div>
    );
  }

  return (
    <Link
      className={cn(
        baseClass,
        "text-foreground no-underline hover:border-[color:var(--node-accent)]",
        status === "mastered" && "bg-card"
      )}
      href={`/articles/${concept.slug}#test-yourself`}
      style={
        { borderColor: color, "--node-accent": color } as React.CSSProperties
      }
    >
      {label}
    </Link>
  );
}

/**
 * Hub-gated skill tree for one domain. Hubs are always open; the rest of the
 * domain unlocks once the reader masters {@link HUBS_REQUIRED_TO_UNLOCK} hubs.
 * Mastery is read from local learning state, so the tree reflects quiz progress
 * live. Articles themselves are never gated — locked nodes only defer the link.
 */
export function SkillTree({ concepts, color }: SkillTreeProps) {
  const state = useLearningState();
  const hubs = concepts.filter((concept) => concept.isHub);
  const rest = concepts.filter((concept) => !concept.isHub);
  const masteredHubs = hubs.filter((hub) => isMastered(state, hub.slug)).length;
  const restUnlocked = masteredHubs >= HUBS_REQUIRED_TO_UNLOCK;
  const masteredTotal = concepts.filter((concept) =>
    isMastered(state, concept.slug)
  ).length;

  const statusFor = (concept: QuizConcept): NodeStatus => {
    if (isMastered(state, concept.slug)) {
      return "mastered";
    }
    if (concept.isHub || restUnlocked) {
      return "unlocked";
    }
    return "locked";
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 font-mono text-[12px] text-foreground-subtle tracking-[0.12em]">
        <span>
          {masteredTotal}/{concepts.length} mastered
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {masteredHubs}/{Math.min(HUBS_REQUIRED_TO_UNLOCK, hubs.length)} hubs
          to unlock the rest
        </span>
      </div>

      <section className="mt-8">
        <h2
          className="m-0 border-t-2 pt-3 font-display font-normal text-[clamp(18px,2.6vw,22px)] text-foreground tracking-[-0.02em]"
          style={{ borderColor: color }}
        >
          Hub concepts{" "}
          <span className="font-mono text-[11px] text-foreground-subtle tracking-[0.12em]">
            start here
          </span>
        </h2>
        <div className="mt-5 flex flex-col gap-3">
          {hubs.map((hub) => (
            <ConceptNode
              color={color}
              concept={hub}
              key={hub.slug}
              status={statusFor(hub)}
            />
          ))}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="mt-12">
          <h2
            className="m-0 border-t-2 pt-3 font-display font-normal text-[clamp(18px,2.6vw,22px)] text-foreground tracking-[-0.02em]"
            style={{ borderColor: color }}
          >
            The rest of the domain{" "}
            <span className="font-mono text-[11px] text-foreground-subtle tracking-[0.12em]">
              {restUnlocked ? "unlocked" : "locked"}
            </span>
          </h2>
          <div className="mt-5 flex flex-col gap-3">
            {rest.map((concept) => (
              <ConceptNode
                color={color}
                concept={concept}
                key={concept.slug}
                status={statusFor(concept)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
