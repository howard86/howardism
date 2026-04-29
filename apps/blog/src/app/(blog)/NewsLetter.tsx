export default function Newsletter() {
  return (
    <div className="hw-card" style={{ padding: "20px 24px" }}>
      <div className="hw-eyebrow" style={{ marginBottom: 12, fontSize: 10 }}>
        Stay up to date
      </div>
      <p
        className="hw-body"
        style={{ fontSize: 13, color: "var(--hw-ink-2)", marginBottom: 16 }}
      >
        Get notified when I publish something new, and unsubscribe at any time.
      </p>
      <form action="/api/subscription" method="POST">
        <div style={{ display: "flex", gap: 8 }}>
          <label className="sr-only" htmlFor="newsletter-email">
            Email address field
          </label>
          <input
            aria-label="Email address"
            autoComplete="on"
            id="newsletter-email"
            name="email"
            placeholder="Email address"
            required
            style={{
              flex: 1,
              height: 32,
              borderRadius: 4,
              border: "1px solid var(--hw-rule)",
              background: "var(--hw-paper)",
              color: "var(--hw-ink)",
              fontFamily: "var(--hw-font-body)",
              fontSize: 13,
              padding: "0 10px",
              outline: "none",
            }}
            type="email"
          />
          <button
            className="hw-chip"
            style={{ cursor: "pointer", flexShrink: 0 }}
            type="submit"
          >
            Join
          </button>
        </div>
      </form>
    </div>
  );
}
