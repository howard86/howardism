import { DiscPageHeader } from "@howardism/design-system";

export const Masthead = () => (
  <DiscPageHeader
    data={[
      ["Curator", "Howard Tai"],
      ["Cadence", "Batched, not scheduled"],
      ["Based", "Taiwan, 23°N"],
    ]}
    eyebrowEnd="Masthead · No. 00"
    eyebrowStart="Howardism · Vol. 03"
    title="A wiki, set"
    titleAccent="in plates."
  >
    <p className="mt-6 max-w-[680px] font-body text-[17px] text-muted-foreground leading-[1.55]">
      Working notes on interaction-era AI, kept publicly. Updated whenever a
      batch finishes — not on a schedule.
    </p>
  </DiscPageHeader>
);

export const CompactWithAccent = () => (
  <DiscPageHeader
    accent="var(--domain-agent-systems)"
    eyebrowEnd="81 notes"
    eyebrowStart="Plate II · Agent Systems"
    title="Agent Systems,"
    titleAccent="in order."
    variant="compact"
  />
);

export const Compact = () => (
  <DiscPageHeader
    eyebrowEnd="Plate IV · No. 04"
    eyebrowStart="Howardism · Vol. 03"
    title="The shelf"
    variant="compact"
  />
);
