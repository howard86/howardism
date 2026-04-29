import ExternalLink from "@/app/(common)/ExternalLink";
import { SunDisc } from "@/components/howardism/SunDisc";
import { SOCIAL_LINKS } from "./SocialLinks";

export function HeroDisc() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 16px 0",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "0 32px",
        alignItems: "center",
      }}
    >
      <div>
        <div className="hw-eyebrow" style={{ marginBottom: 12 }}>
          Howard Tai · vol. 03
        </div>
        <h1
          className="hw-display"
          style={{
            fontSize: 34,
            fontWeight: 400,
            color: "var(--hw-ink)",
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Howardism
        </h1>
        <p
          className="hw-body"
          style={{
            fontSize: 15,
            color: "var(--hw-ink-2)",
            lineHeight: 1.65,
            marginBottom: 24,
            maxWidth: 400,
          }}
        >
          A quiet corner of the web — software craft, mathematics, and the
          occasional ocean adventure.
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

      <SunDisc number="01" plate="Plate I · Surface" size={260} />
    </div>
  );
}
