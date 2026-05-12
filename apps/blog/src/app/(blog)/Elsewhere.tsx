import ExternalLink from "@/app/(common)/ExternalLink";

import { SOCIAL_LINKS } from "./SocialLinks";

const LABEL_MAP: Record<string, string> = {
  "Follow on Twitter": "Twitter",
  "Follow on GitHub": "GitHub",
  "Follow on LinkedIn": "LinkedIn",
  "Contact Howard via email": "Email",
  "Follow on RSS feed": "RSS",
};

export function Elsewhere() {
  return (
    <div className="hw-card" style={{ padding: "20px 24px" }}>
      <div className="hw-eyebrow" style={{ marginBottom: 16, fontSize: 10 }}>
        Elsewhere
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {SOCIAL_LINKS.map((link) => {
          const label = LABEL_MAP[link["aria-label"]] ?? link["aria-label"];
          return (
            <li
              key={link.href}
              style={{ borderBottom: "1px solid var(--hw-rule)" }}
            >
              <ExternalLink
                aria-label={link["aria-label"]}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  textDecoration: "none",
                  color: "var(--hw-ink-2)",
                }}
              >
                <link.icon
                  className="fill-current"
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--hw-ink-3)",
                    flexShrink: 0,
                  }}
                />
                <span
                  className="hw-body"
                  style={{ fontSize: 13, color: "var(--hw-ink)" }}
                >
                  {label}
                </span>
              </ExternalLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
