import { HalfDisc } from "@howardism/design-system";

export const Default = () => (
  <div style={{ width: 380 }}>
    <HalfDisc />
  </div>
);

export const DomainAccentLeft = () => (
  <div style={{ width: 380 }}>
    <HalfDisc accent="var(--domain-agent-systems)" align="left" size={260} />
  </div>
);
