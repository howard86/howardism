import { AboutSidebar } from "./AboutSidebar";

export const metadata = {
  title: "About · Howardism",
  description: "Howard Tai, in long form.",
};

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
      {/* Masthead — no SunDisc, no HalfDisc */}
      <div
        style={{
          borderBottom: "3px double var(--hw-ink)",
          paddingBottom: 12,
          marginTop: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div
          className="hw-mono"
          style={{
            fontSize: 11,
            color: "var(--hw-ink-2)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Howard Tai · Long form
        </div>
        <div
          className="hw-mono"
          style={{
            fontSize: 11,
            color: "var(--hw-ink-3)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Plate IV · No. 04
        </div>
      </div>

      <h1
        className="hw-display"
        data-testid="about-heading"
        style={{
          fontSize: "clamp(40px, 5vw, 68px)",
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
          fontWeight: 400,
          margin: "32px 0 0",
        }}
      >
        Howard Tai,{" "}
        <em style={{ fontStyle: "italic", color: "var(--hw-accent)" }}>
          in long form.
        </em>
      </h1>

      {/* Two-column layout: prose left, sidebar right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: "64px",
          marginTop: 48,
          paddingBottom: 80,
          alignItems: "start",
        }}
      >
        {/* Long-form prose */}
        <article>
          <p
            className="hw-body"
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--hw-ink-2)",
              fontStyle: "italic",
              borderLeft: "3px solid var(--hw-accent)",
              paddingLeft: 20,
              marginBottom: 32,
            }}
          >
            I build things for the web — mostly in TypeScript, occasionally
            underwater. This is where I write about what I'm thinking, what I'm
            making, and what I'm learning.
          </p>

          <p
            className="hw-body"
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--hw-ink)",
              marginBottom: 24,
            }}
          >
            I'm a fullstack developer based in Singapore. I spend most of my
            working hours at{" "}
            <a
              href="https://oddle.me"
              rel="noopener noreferrer"
              style={{ color: "var(--hw-accent)", textDecoration: "underline" }}
              target="_blank"
            >
              Oddle
            </a>
            , where I work on restaurant technology — ordering systems, loyalty
            programmes, and the infrastructure connecting them. Before that I
            passed through fintech (Lootex), enterprise software (FST Network),
            and a brief stint as an officer in the Republic of China Air Force.
          </p>

          <p
            className="hw-body"
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--hw-ink)",
              marginBottom: 24,
            }}
          >
            Outside of work I dive. Not casually — I have logged dives across
            most of South-East Asia, the Philippines, and a few stretches of the
            Indian Ocean. The photographs here are from those trips. They are
            mostly blurry because moving water, moving subjects, and moving
            cameras make for difficult arithmetic.
          </p>

          <p
            className="hw-body"
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--hw-ink)",
              marginBottom: 24,
            }}
          >
            This site is a personal journal. I write about programming,
            architecture, fundamentals, and occasionally the ocean. There is no
            comment system, no analytics, and no newsletter unless you count the
            one I have been meaning to start for three years. You can reach me
            at{" "}
            <a
              href="mailto:howardtai86@gmail.com"
              style={{ color: "var(--hw-accent)", textDecoration: "underline" }}
            >
              howardtai86@gmail.com
            </a>
            .
          </p>

          {/* Section rule */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              margin: "40px 0",
            }}
          >
            <div
              aria-hidden="true"
              style={{ flex: 1, height: 1, background: "var(--hw-rule)" }}
            />
            <span
              aria-hidden="true"
              className="hw-mono"
              style={{
                fontSize: 11,
                color: "var(--hw-ink-3)",
                letterSpacing: "0.2em",
              }}
            >
              §
            </span>
            <div
              aria-hidden="true"
              style={{ flex: 1, height: 1, background: "var(--hw-rule)" }}
            />
          </div>

          <p
            className="hw-body"
            style={{ fontSize: 14, lineHeight: 1.8, color: "var(--hw-ink-2)" }}
          >
            The site is set in Fraunces (display) and Newsreader (body), served
            via Next.js and deployed on Vercel. Source is not public, but most
            of the ideas here are.
          </p>
        </article>

        <AboutSidebar />
      </div>
    </div>
  );
}
