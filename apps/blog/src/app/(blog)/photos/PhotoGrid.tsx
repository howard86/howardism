"use client";

import type { Photo } from "@/components/howardism/photoData";

interface PhotoGridProps {
  photos: Photo[];
}

function formatNumber(n: number): string {
  return String(n).padStart(3, "0");
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 24,
          padding: "40px 0",
        }}
      >
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            style={{
              margin: 0,
              position: "relative",
              aspectRatio: photo.aspect,
              background: getBackground(photo.tone),
              overflow: "hidden",
              borderRadius: 2,
            }}
          >
            {/* Striped placeholder fill */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: `repeating-linear-gradient(135deg, ${getStripe(photo.tone)} 0 12px, transparent 12px 24px)`,
                opacity: 0.6,
              }}
            />

            {/* № overlay */}
            <div
              aria-hidden="true"
              className="hw-mono"
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "rgba(0,0,0,0.55)",
                color: "oklch(0.94 0.01 80)",
                fontSize: 10,
                letterSpacing: "0.14em",
                padding: "3px 7px",
                lineHeight: 1.4,
              }}
            >
              №{formatNumber(index + 1)}
            </div>

            {/* lens-meta strip */}
            <figcaption
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0,0,0,0.48)",
                padding: "8px 12px",
              }}
            >
              <div
                className="hw-mono"
                style={{
                  fontSize: 10,
                  color: "oklch(0.94 0.01 80)",
                  letterSpacing: "0.1em",
                  lineHeight: 1.5,
                }}
              >
                {photo.meta}
              </div>
              <div
                className="hw-mono"
                style={{
                  fontSize: 10,
                  color: "oklch(0.78 0.01 80)",
                  letterSpacing: "0.08em",
                  marginTop: 2,
                }}
              >
                {photo.caption}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* End of roll */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "24px 0 40px",
        }}
      >
        <div
          aria-hidden="true"
          style={{ flex: 1, height: 1, background: "var(--hw-rule)" }}
        />
        <span
          className="hw-mono"
          style={{
            fontSize: 10,
            color: "var(--hw-ink-3)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          End of roll
        </span>
        <div
          aria-hidden="true"
          style={{ flex: 1, height: 1, background: "var(--hw-rule)" }}
        />
      </div>
    </div>
  );
}

function getBackground(tone: number): string {
  const backgrounds = [
    "oklch(0.82 0.05 200)",
    "oklch(0.75 0.06 260)",
    "oklch(0.78 0.05 150)",
    "oklch(0.80 0.07 40)",
    "oklch(0.76 0.06 310)",
  ];
  return backgrounds[tone % backgrounds.length] ?? backgrounds[0];
}

function getStripe(tone: number): string {
  const stripes = [
    "oklch(0.55 0.08 200 / 0.4)",
    "oklch(0.48 0.09 260 / 0.4)",
    "oklch(0.52 0.08 150 / 0.4)",
    "oklch(0.54 0.10 40 / 0.4)",
    "oklch(0.50 0.09 310 / 0.4)",
  ];
  return stripes[tone % stripes.length] ?? stripes[0];
}
