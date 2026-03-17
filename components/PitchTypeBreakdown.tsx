// Horizontal bar chart of pitch types hit for HRs.

import { pitchDotColor } from "@/components/PitchZoneMap";

interface HRPitch {
  pitchType: string | null;
}

export default function PitchTypeBreakdown({
  hrs,
  activePitchType,
}: {
  hrs: HRPitch[];
  activePitchType: string | null;
}) {
  // Count by pitch type
  const counts = new Map<string, number>();
  for (const hr of hrs) {
    const key = hr.pitchType ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;

  if (entries.length === 0) return <p className="text-zinc-700 text-xs text-center py-4">no data</p>;

  return (
    <div className="space-y-2">
      {entries.map(([type, count]) => {
        const isActive = type === activePitchType;
        const pct = Math.round((count / max) * 100);
        const color = pitchDotColor(type);
        return (
          <div key={type}>
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-xs truncate ${isActive ? "text-zinc-100 font-medium" : "text-zinc-500"}`}>
                {type.toLowerCase()}
              </span>
              <span className={`text-xs tabular-nums ml-2 shrink-0 ${isActive ? "text-zinc-300" : "text-zinc-600"}`}>
                {count}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color, opacity: isActive ? 1 : 0.45 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
