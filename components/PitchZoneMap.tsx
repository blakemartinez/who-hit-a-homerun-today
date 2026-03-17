// Strike zone map — shows where in the zone each HR pitch was located.
// MLB API pX: horizontal (-0.85 left edge to +0.85 right, from catcher's view)
// MLB API pZ: vertical (~1.5 ft = low edge, ~3.5 ft = high edge)

interface HRDot {
  pitchX: number | null;
  pitchZ: number | null;
  pitchType: string | null;
}

// Viewbox coords
const VW = 100;
const VH = 110;
// Strike zone in viewbox space
const ZL = 15, ZR = 85, ZT = 15, ZB = 85; // left, right, top, bottom

function toVX(pX: number) {
  // pX range roughly -1.2 to +1.2 (with margin beyond zone edges)
  return ((pX + 1.2) / 2.4) * VW;
}
function toVY(pZ: number) {
  // pZ range roughly 0.5 to 5.0
  return VH - ((pZ - 0.5) / 4.5) * VH;
}

const CATEGORY: Record<string, string> = {
  fastball: "#ef4444",   // red
  sinker:   "#ef4444",
  cutter:   "#f97316",   // orange
  slider:   "#a78bfa",   // purple
  sweeper:  "#a78bfa",
  curve:    "#60a5fa",   // blue
  "knuckle curve": "#60a5fa",
  changeup: "#34d399",   // green
  splitter: "#34d399",
  forkball: "#34d399",
  knuckleball: "#e4e4e7",
  eephus:   "#e4e4e7",
};

function dotColor(pitchType: string | null): string {
  if (!pitchType) return "#52525b";
  const lower = pitchType.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY)) {
    if (lower.includes(key)) return color;
  }
  return "#52525b";
}

export { dotColor as pitchDotColor };

export default function PitchZoneMap({
  hrs,
  activeIdx,
}: {
  hrs: HRDot[];
  activeIdx?: number;
}) {
  const indexed = hrs
    .map((hr, i) => ({ ...hr, originalIdx: i }))
    .filter((hr) => hr.pitchX != null && hr.pitchZ != null);

  if (indexed.length === 0) return <p className="text-zinc-700 text-xs text-center py-4">no data</p>;

  // Sort: regular → active on top
  const sorted = [...indexed].sort((a, b) => {
    const aA = a.originalIdx === activeIdx;
    const bA = b.originalIdx === activeIdx;
    return Number(aA) - Number(bA);
  });

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full block"
      aria-label="Pitch zone map"
    >
      {/* Outer zone border */}
      <rect
        x={ZL} y={ZT} width={ZR - ZL} height={ZB - ZT}
        fill="none" stroke="#3f3f46" strokeWidth="0.8"
      />
      {/* 3x3 grid lines */}
      {[1, 2].map((n) => (
        <g key={n}>
          <line
            x1={ZL + (ZR - ZL) * n / 3} y1={ZT}
            x2={ZL + (ZR - ZL) * n / 3} y2={ZB}
            stroke="#27272a" strokeWidth="0.5"
          />
          <line
            x1={ZL} y1={ZT + (ZB - ZT) * n / 3}
            x2={ZR} y2={ZT + (ZB - ZT) * n / 3}
            stroke="#27272a" strokeWidth="0.5"
          />
        </g>
      ))}

      {/* Dots */}
      {sorted.map((hr) => {
        const isActive = hr.originalIdx === activeIdx;
        const cx = toVX(hr.pitchX!);
        const cy = toVY(hr.pitchZ!);
        const fill = isActive ? "#ffffff" : dotColor(hr.pitchType);
        return (
          <g key={hr.originalIdx}>
            {isActive && (
              <circle cx={cx} cy={cy} r="9" fill="none" stroke="#e4e4e7" strokeWidth="1" opacity="0.25" />
            )}
            <circle
              cx={cx} cy={cy}
              r={isActive ? 5 : 3.5}
              fill={fill}
              opacity={isActive ? 1 : 0.6}
            />
          </g>
        );
      })}

      {/* Labels */}
      <text x={VW / 2} y={VH - 1} textAnchor="middle" fontSize="5" fill="#3f3f46">inside ← → outside</text>
    </svg>
  );
}
