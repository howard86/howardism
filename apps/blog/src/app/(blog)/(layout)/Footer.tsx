import Link from "next/link";

import { Avatar } from "./Avatar";
import { FOOTER_NAV } from "./constants";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px dashed var(--hw-rule)",
        marginTop: "auto",
        paddingTop: 24,
        paddingBottom: 32,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Nav row */}
        <nav aria-label="Footer">
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 2px",
            }}
          >
            {FOOTER_NAV.map(({ label, href }) => (
              <li key={label}>
                <Link
                  className="hw-chip"
                  href={href}
                  style={{ textDecoration: "none" }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Caption row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Avatar label="Home" size={28} />
          <span
            className="hw-mono"
            style={{ fontSize: 11, color: "var(--hw-ink-3)" }}
          >
            &copy; Howardism &middot; {new Date().getFullYear()} &middot;
            Singapore / anywhere
          </span>
        </div>
      </div>
    </footer>
  );
}
