import { DomainLabel } from "@howardism/design-system";

const meta =
  "font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.12em]";

export const Domains = () => (
  <div className={`flex flex-col gap-2 ${meta}`}>
    <div>
      <DomainLabel domain="agent-systems" />
    </div>
    <div>
      <DomainLabel domain="evals-and-benchmarks" />
    </div>
    <div>
      <DomainLabel domain="model-capability-and-training" />
    </div>
    <div>
      <DomainLabel domain="ai-coding-practice" />
    </div>
  </div>
);

export const Large = () => (
  <div className={meta}>
    <DomainLabel domain="alignment-and-safety" size={12} />
  </div>
);
