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

/** Sample a quadratic bezier at parameter t (0–1). */
function qBez(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * x1 + t * t * x2,
    y: mt * mt * y0 + 2 * mt * t * y1 + t * t * y2,
  };
}

export default function HRTrajectory({ launchAngle, distance, exitVelo, index, coordX, coordY }: Props) {
  const arcId    = `arcPath-${index}`;
  const shadowId = `shadowPath-${index}`;
  const blurId   = `blur-${index}`;
  const glowId   = `glow-${index}`;

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

  const arcPath    = `M ${HOME_X},${GROUND_Y} Q ${cpX},${cpY} ${landX},${GROUND_Y}`;
  const shadowPath = `M ${HOME_X},${GROUND_Y} L ${landX},${GROUND_Y}`;

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

  // Spark particle positions (sampled along arc at t = 0.22, 0.5, 0.76)
  const sparks = [0.22, 0.5, 0.76].map((t) =>
    qBez(t, HOME_X, GROUND_Y, cpX, cpY, landX, GROUND_Y)
  );

  // Glow color by exit velo: indigo (default) → amber (110+) → orange (115+)
  const glowColor =
    exitVelo != null && exitVelo >= 115 ? "#f97316"
    : exitVelo != null && exitVelo >= 110 ? "#fbbf24"
    : "#818cf8";

  // Physics-based easing:
  //   58% of animation time for upswing (decelerating vs gravity)
  //   42% for downswing (accelerating with gravity)
  const pKT = "0;0.58;1";
  const pKP = "0;0.5;1";
  const pKS = "0.42 0 0.65 0.25;0.35 0.75 0.58 1";

  const begin  = "0.05s";
  const dur    = "1.2s";
  const landAt = "1.25s"; // begin + dur

  // Approximate absolute begin times when ball passes each spark (t=0.22, 0.5, 0.76)
  const sparkBegins = ["0.42s", "0.72s", "0.98s"];

  return (
    <div className="mt-2 select-none">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" aria-hidden="true">
        <defs>
          <path id={arcId}    d={arcPath} />
          <path id={shadowId} d={shadowPath} />

          {/* Soft blur for glow halo on ball and arc */}
          <filter id={blurId} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          {/* Arc glow: blur + merge over original for a crisp corona */}
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Field ──────────────────────────────────────────── */}

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
            <text x={WALL_REF_X} y={108} textAnchor="middle" fill="#3f3f46" fontSize="5">
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
        <text x={angleLabelX} y={angleLabelY} textAnchor="middle" fill="#a1a1aa" fontSize="5">
          {launchAngle}°
        </text>

        {/* ── Moving ground shadow ───────────────────────────── */}
        {/* Ellipse moves under ball at ground level (linear = uniform horizontal velocity) */}
        <ellipse rx="6" ry="2" fill="#000" opacity="0">
          <animate attributeName="opacity"
            values="0;0;0.45;0.45;0" keyTimes="0;0.04;0.08;0.87;1"
            dur={dur} begin={begin} fill="freeze" />
          <animateMotion dur={dur} begin={begin} fill="freeze" calcMode="linear">
            <mpath href={`#${shadowId}`} />
          </animateMotion>
        </ellipse>

        {/* ── Trajectory arc ─────────────────────────────────── */}

        {/* Glow arc (blurred, colored) — draws with physics easing */}
        <path d={arcPath} fill="none" stroke={glowColor} strokeWidth="4" opacity="0"
          filter={`url(#${blurId})`}
          pathLength="1" strokeDasharray="1" strokeDashoffset="1">
          <animate attributeName="stroke-dashoffset" values="1;0.5;0"
            keyTimes={pKT} calcMode="spline" keySplines={pKS}
            dur={dur} begin={begin} fill="freeze" />
          <animate attributeName="opacity" values="0;0.5;0.5" keyTimes="0;0.04;1"
            dur={dur} begin={begin} fill="freeze" />
        </path>

        {/* Main arc (bright, slightly glowing) — draws with physics easing */}
        <path d={arcPath} fill="none" stroke="#c4c4cf" strokeWidth="1.5"
          filter={`url(#${glowId})`}
          pathLength="1" strokeDasharray="1" strokeDashoffset="1">
          <animate attributeName="stroke-dashoffset" values="1;0.5;0"
            keyTimes={pKT} calcMode="spline" keySplines={pKS}
            dur={dur} begin={begin} fill="freeze" />
        </path>

        {/* ── Spark particles ────────────────────────────────── */}
        {sparks.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r="1" fill={glowColor} opacity="0">
            <animate attributeName="opacity" values="0;0.9;0"
              keyTimes="0;0.12;1" dur="0.4s" begin={sparkBegins[i]} fill="freeze" />
            <animate attributeName="r" from="1" to="6" dur="0.4s" begin={sparkBegins[i]} fill="freeze" />
          </circle>
        ))}

        {/* ── Ball ───────────────────────────────────────────── */}

        {/* Glow halo (blurred, colored) — physics motion */}
        <circle r="9" fill={glowColor} opacity="0" filter={`url(#${blurId})`}>
          <animate attributeName="opacity" values="0;0;0.7;0.7;0"
            keyTimes="0;0.04;0.07;0.82;1"
            dur={dur} begin={begin} fill="freeze" />
          <animateMotion dur={dur} begin={begin} fill="freeze"
            calcMode="spline" keyTimes={pKT} keyPoints={pKP} keySplines={pKS}>
            <mpath href={`#${arcId}`} />
          </animateMotion>
        </circle>

        {/* Ball (solid; fades out just before landing dot appears) */}
        <circle r="3.5" fill="#f4f4f5" opacity="0">
          <animate attributeName="opacity" values="0;1;1;0"
            keyTimes="0;0.05;0.82;1"
            dur={dur} begin={begin} fill="freeze" />
          <animateMotion dur={dur} begin={begin} fill="freeze"
            calcMode="spline" keyTimes={pKT} keyPoints={pKP} keySplines={pKS}>
            <mpath href={`#${arcId}`} />
          </animateMotion>
        </circle>

        {/* ── Exit velo label ────────────────────────────────── */}
        {exitVelo != null && (
          <g opacity="0">
            {/* Appears near apex: 58% × 1.2s + 0.05s ≈ 0.75s */}
            <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.72s" fill="freeze" />
            <rect
              x={veloLabelX - 16} y={veloLabelY - 5}
              width={32} height={9}
              fill="rgba(9,9,11,0.85)" rx="1"
            />
            <text x={veloLabelX} y={veloLabelY + 2} textAnchor="middle" fill="#a1a1aa" fontSize="6">
              {exitVelo} mph
            </text>
          </g>
        )}

        {/* ── Landing ────────────────────────────────────────── */}

        {/* White flash on impact */}
        <circle cx={landX} cy={landY} r="2.5" fill="white" opacity="0">
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.05;1" dur="0.28s" begin={landAt} fill="freeze" />
          <animate attributeName="r" from="2.5" to="9" dur="0.28s" begin={landAt} fill="freeze" />
        </circle>

        {/* Outer ring */}
        <circle cx={landX} cy={landY} r="2.5" fill="none" stroke="#e4e4e7" strokeWidth="1.2" opacity="0">
          <animate attributeName="opacity" values="0;0.85;0" keyTimes="0;0.08;1" dur="0.65s" begin={landAt} fill="freeze" />
          <animate attributeName="r" from="2.5" to="16" dur="0.65s" begin={landAt} fill="freeze" />
          <animate attributeName="stroke-width" from="1.2" to="0.2" dur="0.65s" begin={landAt} fill="freeze" />
        </circle>

        {/* Inner ring */}
        <circle cx={landX} cy={landY} r="2.5" fill="none" stroke="#71717a" strokeWidth="0.9" opacity="0">
          <animate attributeName="opacity" values="0;0.55;0" keyTimes="0;0.12;1" dur="0.42s" begin={landAt} fill="freeze" />
          <animate attributeName="r" from="2.5" to="9" dur="0.42s" begin={landAt} fill="freeze" />
        </circle>

        {/* Landing dot */}
        <circle cx={landX} cy={landY} r="2.5" fill="#d4d4d8" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.1s" begin={landAt} fill="freeze" />
        </circle>

        {/* Distance label */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin={landAt} fill="freeze" />
          <rect
            x={landX - 14} y={landY + 3}
            width={28} height={8}
            fill="rgba(9,9,11,0.85)" rx="1"
          />
          <text x={landX} y={landY + 9} textAnchor="middle" fill="#a1a1aa" fontSize="5.5">
            {distance} ft
          </text>
        </g>

        {/* ── Spray mini-map ─────────────────────────────────── */}
        {hasSpray && (
          <g>
            <path d="M 9,30 A 13,13 0 0 1 35,30" fill="none" stroke="#3f3f46" strokeWidth="0.8" />
            <line
              x1="22" y1="30"
              x2={sprayEndX} y2={sprayEndY}
              stroke="#52525b" strokeWidth="1" strokeLinecap="round"
            />
            <circle cx={sprayEndX} cy={sprayEndY} r="1.5" fill="#a1a1aa" />
          </g>
        )}
      </svg>
    </div>
  );
}
