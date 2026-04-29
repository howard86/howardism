import ExternalLink from "@/app/(common)/ExternalLink";
import { SOCIAL_LINKS } from "./SocialLinks";

export function HeroStatement() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "64px 16px 0",
        textAlign: "center",
      }}
    >
      <div className="hw-eyebrow" style={{ marginBottom: 16 }}>
        Howard Tai · vol. 03
      </div>
      <h1
        className="hw-display"
        style={{
          fontSize: 48,
          fontWeight: 300,
          color: "var(--hw-ink)",
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: "-0.02em",
        }}
      >
        Exploring the Depths
      </h1>
      <p
        className="hw-body"
        style={{
          fontSize: 16,
          fontStyle: "italic",
          color: "var(--hw-ink-2)",
          lineHeight: 1.65,
          marginBottom: 32,
          maxWidth: 480,
          margin: "0 auto 32px",
        }}
      >
        Software engineer, mathematician, amateur diver — writing about craft,
        curiosity, and the occasional ocean adventure from Singapore.
      </p>
      <ul
        style={{
          display: "flex",
          gap: 8,
          listStyle: "none",
          padding: 0,
          margin: 0,
          justifyContent: "center",
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
  );
}
