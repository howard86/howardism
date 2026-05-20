interface TopicSparklineProps {
  /** Per-week activity counts, oldest → newest. */
  bars: number[];
  color: string;
}

const BAR_MAX_PX = 30;
const BAR_MIN_PX = 4;
const RECENT_WEEKS = 3;

/**
 * Tiny 8-week activity sparkline for a topic plate. Heights scale to the
 * topic's own peak; the most recent weeks read in full color, earlier weeks
 * are muted.
 */
export function TopicSparkline({ bars, color }: TopicSparklineProps) {
  const peak = Math.max(1, ...bars);
  return (
    <div
      aria-hidden="true"
      className="flex items-end gap-[3px]"
      style={{ height: BAR_MAX_PX }}
    >
      {bars.map((value, i) => {
        const height = value === 0 ? BAR_MIN_PX : (value / peak) * BAR_MAX_PX;
        const isRecent = i >= bars.length - RECENT_WEEKS;
        return (
          <span
            className="w-2 rounded-[1px]"
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length weekly series, position is the identity
            key={i}
            style={{
              background: color,
              height: Math.max(BAR_MIN_PX, height),
              opacity: isRecent ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
