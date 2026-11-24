import { Ph } from "@howardism/design-system";

export const Portrait = () => (
  <div style={{ width: 240 }}>
    <Ph
      aspect="4/5"
      label="portrait · 4x5"
      meta="Howard Tai, Taipei"
      tone={0}
    />
  </div>
);

export const Tones = () => (
  <div className="flex gap-3" style={{ width: 560 }}>
    {[0, 1, 2, 3, 4].map((t) => (
      <div key={t} style={{ flex: 1 }}>
        <Ph aspect="3/4" label={`plate ${t + 1}`} tone={t} />
      </div>
    ))}
  </div>
);
