"use client";

const VIEW_W = 420;
const VIEW_H = 145;
const GROUND_Y = 125;
const HOME_X = 45;
const WALL_REF_DIST = 400; // ft
const WALL_REF_X = HOME_X + (WALL_REF_DIST / 500) * 330; // 309

interface Props {
  launchAngle: number;
  distance: number;
  exitVelo: number | null;
  venue: string;
  index: number;
  coordX?: number | null;
  coordY?: number | null;
}

export default function HRTrajectory({ launchAngle, distance, exitVelo, index, coordX, coordY }: Props) {
  const arcId = `arcPath-${index}`;

  // Landing position
  const landX = HOME_X + Math.min(distance / 500, 1) * 330;
  const landY = GROUND_Y;

  // Physics arc apex
  const apexFt = (distance * Math.tan((launchAngle * Math.PI) / 180)) / 4;
  const apexFtCapped = Math.min(apexFt, 140);
  const apexPx = Math.min(apexFtCapped * 0.62, 105);

  // Quadratic bezier control point (midpoint makes peak exactly apexPx above ground)
  const cpX = (HOME_X + landX) / 2;
  const cpY = GROUND_Y - 2 * apexPx;

  const arcPath = `M ${HOME_X},${GROUND_Y} Q ${cpX},${cpY} ${landX},${GROUND_Y}`;

  // Wall reference: only show if ball clearly cleared 400ft mark
  const showWall = landX > WALL_REF_X + 20;

  // Launch angle indicator
  const angleRad = (launchAngle * Math.PI) / 180;
  const indLen = 16;
  const indEndX = HOME_X + Math.cos(angleRad) * indLen;
  const indEndY = GROUND_Y - Math.sin(angleRad) * indLen;

  // Label position: above-right if angle < 35°, above if >= 35°
  const labelAbove = launchAngle >= 35;
  const angleLabelX = labelAbove ? indEndX : indEndX + 2;
  const angleLabelY = labelAbove ? indEndY - 5 : indEndY - 3;

  // Exit velo label position (above arc apex)
  const veloLabelX = cpX;
  const veloLabelY = GROUND_Y - apexPx - 14;

  // Spray mini-map (only if coords available)
  const hasSpray = coordX != null && coordY != null;
  let sprayEndX = 22;
  let sprayEndY = 30;
  if (hasSpray && coordX != null && coordY != null) {
    const dx = coordX - 125;
    const dy = 205 - coordY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      sprayEndX = 22 + (dx / len) * 11;
      sprayEndY = 30 - (dy / len) * 11;
    }
  }

  return (
    <div className="mt-2 select-none">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" aria-hidden="true">
        <defs>
          <path id={arcId} d={arcPath} />
        </defs>

        {/* Ground line */}
        <line x1="0" y1={GROUND_Y} x2={VIEW_W} y2={GROUND_Y} stroke="#27272a" strokeWidth="1" />

        {/* Home plate */}
        <circle cx={HOME_X} cy={GROUND_Y} r="2" fill="#3f3f46" />

        {/* Wall reference line */}
        {showWall && (
          <g>
            <line
              x1={WALL_REF_X} y1={110}
              x2={WALL_REF_X} y2={GROUND_Y}
              stroke="#3f3f46" strokeWidth="1" strokeDasharray="2 2"
            />
            <text
              x={WALL_REF_X} y={108}
              textAnchor="middle" fill="#3f3f46" fontSize="5"
            >
              400ft
            </text>
          </g>
        )}

        {/* Launch angle indicator */}
        <line
          x1={HOME_X} y1={GROUND_Y}
          x2={indEndX} y2={indEndY}
          stroke="#52525b" strokeWidth="1" strokeLinecap="round"
        />
        <rect
          x={angleLabelX - 8} y={angleLabelY - 5}
          width={16} height={7}
          fill="rgba(9,9,11,0.8)" rx="1"
        />
        <text
          x={angleLabelX} y={angleLabelY}
          textAnchor="middle" fill="#a1a1aa" fontSize="5"
        >
          {launchAngle}°
        </text>

        {/* Trajectory arc — draws animated */}
        <path
          d={arcPath}
          fill="none"
          stroke="#a1a1aa"
          strokeWidth="1.5"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1" to="0"
            dur="1s" begin="0.05s" fill="freeze"
          />
        </path>

        {/* Ball animates along arc, fades before landing */}
        <circle r="3.5" fill="#e4e4e7" opacity="0">
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.05;0.82;1"
            dur="1s" begin="0.05s" fill="freeze"
          />
          <animateMotion dur="1s" begin="0.05s" fill="freeze">
            <mpath href={`#${arcId}`} />
          </animateMotion>
        </circle>

        {/* Exit velo label fades in at apex */}
        {exitVelo != null && (
          <g opacity="0">
            <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.45s" fill="freeze" />
            <rect
              x={veloLabelX - 16} y={veloLabelY - 5}
              width={32} height={9}
              fill="rgba(9,9,11,0.8)" rx="1"
            />
            <text x={veloLabelX} y={veloLabelY + 2} textAnchor="middle" fill="#a1a1aa" fontSize="6">
              {exitVelo} mph
            </text>
          </g>
        )}

        {/* Landing dot */}
        <circle cx={landX} cy={landY} r="2.5" fill="#d4d4d8" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.1s" begin="1.05s" fill="freeze" />
        </circle>

        {/* Landing pulse ring */}
        <circle cx={landX} cy={landY} r="2.5" fill="none" stroke="#71717a" strokeWidth="1" opacity="0">
          <animate attributeName="opacity" from="0.7" to="0" dur="0.7s" begin="1.05s" fill="freeze" />
          <animate attributeName="r" from="2.5" to="10" dur="0.7s" begin="1.05s" fill="freeze" />
        </circle>

        {/* Distance label fades in at landing */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="1.05s" fill="freeze" />
          <rect
            x={landX - 14} y={landY + 3}
            width={28} height={8}
            fill="rgba(9,9,11,0.8)" rx="1"
          />
          <text x={landX} y={landY + 9} textAnchor="middle" fill="#a1a1aa" fontSize="5.5">
            {distance} ft
          </text>
        </g>

        {/* Spray mini-map */}
        {hasSpray && (
          <g>
            {/* Outfield semicircle */}
            <path d="M 9,30 A 13,13 0 0 1 35,30" fill="none" stroke="#3f3f46" strokeWidth="0.8" />
            {/* Direction line */}
            <line
              x1="22" y1="30"
              x2={sprayEndX} y2={sprayEndY}
              stroke="#52525b" strokeWidth="1" strokeLinecap="round"
            />
            {/* Dot at landing direction */}
            <circle cx={sprayEndX} cy={sprayEndY} r="1.5" fill="#a1a1aa" />
          </g>
        )}
      </svg>
    </div>
  );
}
