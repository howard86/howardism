import ExternalLink from "@/app/(common)/ExternalLink";
import { Ph } from "@/components/howardism/Ph";
import { SOCIAL_LINKS } from "./SocialLinks";

export function HeroClassic() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 16px 0",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "0 40px",
        alignItems: "start",
      }}
    >
      <div>
        <div className="hw-eyebrow" style={{ marginBottom: 12 }}>
          Howard Tai · Software Engineer
        </div>
        <h1
          className="hw-display"
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "var(--hw-ink)",
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          A Software Engineer, Mathematician,
          <br />
          and Amateur Diver&apos;s Journey
        </h1>
        <p
          className="hw-body"
          style={{
            fontSize: 15,
            color: "var(--hw-ink-2)",
            lineHeight: 1.65,
            marginBottom: 24,
            maxWidth: 460,
          }}
        >
          I&apos;m Howard — senior fullstack developer, mathematician, and
          amateur diver based in Singapore. I write about software craft, the
          ocean, and everything in between.
        </p>
        <ul
          style={{
            display: "flex",
            gap: 8,
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {SOCIAL_LINKS.map((link) => (
            <li key={link.href}>
              <ExternalLink
                aria-label={link["aria-label"]}
                href={link.href}
                style={{
                  display: "inline-flex",
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  color: "var(--hw-ink-3)",
                  transition: "color 0.15s",
                }}
              >
                <link.icon className="w-5 fill-current" />
              </ExternalLink>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ paddingTop: 4 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Ph aspect="1/1" label="Portrait" tone={1} />
        </div>
      </div>
    </div>
  );
}
