import { DomainDot } from "@howardism/design-system";

const row =
  "flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em]";

export const Domains = () => (
  <div className="flex flex-col gap-2">
    {(
      [
        ["agent-systems", "Agent Systems"],
        ["evals-and-benchmarks", "Evals & Benchmarks"],
        ["alignment-and-safety", "Alignment & Safety"],
        ["interpretability", "Interpretability"],
      ] as const
    ).map(([d, l]) => (
      <div className={row} key={d}>
        <DomainDot domain={d} />
        {l}
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div className="flex items-center gap-4">
    <DomainDot domain="agent-security" size={6} />
    <DomainDot domain="agent-security" size={10} />
    <DomainDot domain="agent-security" size={16} />
    <DomainDot domain="agent-security" size={24} />
  </div>
);
