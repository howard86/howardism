import { resume } from "../Resume";

interface RuledRowProps {
  label: string;
  meta?: string;
  sub?: string;
}

function RuledRow({ label, sub, meta }: RuledRowProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--hw-rule)",
        padding: "10px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <div>
        <div
          className="hw-body"
          style={{ fontSize: 13, color: "var(--hw-ink)" }}
        >
          {label}
        </div>
        {sub && (
          <div
            className="hw-mono"
            style={{ fontSize: 10, color: "var(--hw-ink-3)", marginTop: 2 }}
          >
            {sub}
          </div>
        )}
      </div>
      {meta && (
        <span
          className="hw-mono"
          style={{
            fontSize: 10,
            color: "var(--hw-ink-3)",
            whiteSpace: "nowrap",
          }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  title: string;
}

function Section({ title, children, id }: SectionProps) {
  return (
    <div id={id} style={{ marginBottom: 40 }}>
      <div
        className="hw-mono"
        style={{
          fontSize: 10,
          color: "var(--hw-ink-2)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          borderBottom: "2px solid var(--hw-ink)",
          paddingBottom: 8,
          marginBottom: 0,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

const NOW_READING = [
  { label: "The Glass Bead Game", sub: "Hermann Hesse", meta: "in progress" },
  {
    label: "A Pattern Language",
    sub: "Alexander, Ishikawa, Silverstein",
    meta: "reference",
  },
  {
    label: "The Practice of Programming",
    sub: "Kernighan & Pike",
    meta: "re-read",
  },
];

const COLOPHON = [
  { label: "Set in Fraunces + Newsreader", meta: "display · body" },
  { label: "JetBrains Mono", meta: "mono" },
  { label: "Next.js 16 + Tailwind v4", meta: "stack" },
  { label: "Deployed on Vercel", meta: "host" },
  { label: "Written in Singapore", meta: "location" },
];

interface ResumeEntry {
  company: string;
  end: string | { label: string; dateTime: string };
  start: string | { label: string; dateTime: string };
  title: string;
}

function getLabel(time: string | { label: string; dateTime: string }): string {
  return typeof time === "string" ? time : time.label;
}

export function AboutSidebar() {
  return (
    <aside data-testid="about-sidebar">
      <Section title="Now reading">
        {NOW_READING.map((item) => (
          <RuledRow
            key={item.label}
            label={item.label}
            meta={item.meta}
            sub={item.sub}
          />
        ))}
      </Section>

      <Section title="Where I've been">
        {(resume as ResumeEntry[]).map((role) => (
          <RuledRow
            key={role.title}
            label={role.company}
            meta={`${getLabel(role.start)} — ${getLabel(role.end)}`}
            sub={role.title}
          />
        ))}
      </Section>

      <Section id="colophon" title="Colophon">
        {COLOPHON.map((item) => (
          <RuledRow key={item.label} label={item.label} meta={item.meta} />
        ))}
      </Section>
    </aside>
  );
}
