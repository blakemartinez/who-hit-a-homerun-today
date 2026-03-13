// Top-down spray map of HR landing spots using MLB spray chart coordinates.
// Home plate ≈ (125, 205). Field extends upward (lower y = deeper into OF).

interface HRDot {
  coordX: number | null;
  coordY: number | null;
  distance: number | null;
  exitVelo: number | null;
}

function dotFill(distance: number | null, exitVelo: number | null): string {
  if ((distance ?? 0) >= 450) return "#ef4444";  // red  — moonshot
  if ((exitVelo ?? 0) >= 110) return "#eab308";  // yellow — scorcher
  return "#a1a1aa";                               // zinc-400 — regular
}

// Field landmarks in MLB spray chart coordinate space
const HOME = { x: 125, y: 205 };
const LF   = { x: 22,  y: 82 };   // LF foul pole area
const RF   = { x: 228, y: 82 };   // RF foul pole area
const CF   = { x: 125, y: 16 };   // deepest center
const B1   = { x: 173, y: 157 };  // first base
const B2   = { x: 125, y: 110 };  // second base
const B3   = { x: 77,  y: 157 };  // third base
const MOUND = { x: 125, y: 158 }; // pitcher's mound (approx)

export default function HRSprayMap({
  hrs,
  activeIdx,
}: {
  hrs: HRDot[];
  activeIdx?: number;
}) {
  const indexedDots = hrs
    .map((hr, i) => ({ ...hr, originalIdx: i }))
    .filter((hr) => hr.coordX != null && hr.coordY != null);

  if (indexedDots.length === 0) return <p className="text-zinc-700 text-xs text-center py-4">no data</p>;

  const hasMoonshot = indexedDots.some((d) => (d.distance ?? 0) >= 450);
  const hasScorcher = indexedDots.some((d) => (d.exitVelo ?? 0) >= 110);

  // Sort: regular → special → active (active always on top)
  const sorted = [...indexedDots].sort((a, b) => {
    const aActive = a.originalIdx === activeIdx;
    const bActive = b.originalIdx === activeIdx;
    if (aActive !== bActive) return aActive ? 1 : -1;
    const aSpec = (a.distance ?? 0) >= 450 || (a.exitVelo ?? 0) >= 110;
    const bSpec = (b.distance ?? 0) >= 450 || (b.exitVelo ?? 0) >= 110;
    return Number(aSpec) - Number(bSpec);
  });

  return (
    <div>
      <svg
        viewBox="0 0 250 215"
        className="w-full block"
        aria-label="Home run spray chart"
      >
        {/* Outfield arc */}
        <path
          d={`M ${LF.x},${LF.y} Q ${CF.x},${CF.y} ${RF.x},${RF.y}`}
          fill="none"
          stroke="#27272a"
          strokeWidth="1"
        />

        {/* Foul lines */}
        <line x1={HOME.x} y1={HOME.y} x2={LF.x} y2={LF.y} stroke="#27272a" strokeWidth="0.75" />
        <line x1={HOME.x} y1={HOME.y} x2={RF.x} y2={RF.y} stroke="#27272a" strokeWidth="0.75" />

        {/* Infield diamond */}
        <polygon
          points={`${HOME.x},${HOME.y} ${B1.x},${B1.y} ${B2.x},${B2.y} ${B3.x},${B3.y}`}
          fill="none"
          stroke="#3f3f46"
          strokeWidth="0.7"
        />

        {/* Pitcher's mound */}
        <circle cx={MOUND.x} cy={MOUND.y} r="3" fill="none" stroke="#3f3f46" strokeWidth="0.6" />

        {/* Home plate */}
        <polygon
          points={`${HOME.x},${HOME.y - 3} ${HOME.x + 2.5},${HOME.y} ${HOME.x},${HOME.y + 1.5} ${HOME.x - 2.5},${HOME.y}`}
          fill="#3f3f46"
        />

        {/* HR dots */}
        {sorted.map((hr) => {
          const isActive = hr.originalIdx === activeIdx;
          return (
            <g key={hr.originalIdx}>
              {isActive && (
                <circle
                  cx={hr.coordX!}
                  cy={hr.coordY!}
                  r="9"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="1"
                  opacity="0.3"
                />
              )}
              <circle
                cx={hr.coordX!}
                cy={hr.coordY!}
                r={isActive ? 5.5 : 4}
                fill={isActive ? "#ffffff" : dotFill(hr.distance, hr.exitVelo)}
                opacity={isActive ? 1 : 0.55}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1">
        <span className="flex items-center gap-1 text-xs text-zinc-600">
          <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" />
          HR
        </span>
        {hasMoonshot && (
          <span className="flex items-center gap-1 text-xs text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            moonshot
          </span>
        )}
        {hasScorcher && (
          <span className="flex items-center gap-1 text-xs text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
            scorcher
          </span>
        )}
      </div>
    </div>
  );
}
