"use client";

// Perspective view: camera slightly right of home plate, looking toward CF
// Home plate = lower-right; LF = upper-left; RF = upper-right (foreshortened)
const W = 185;
const H = 100;
const HOME   = { x: 155, y: 86 };
const LF_END = { x: 14,      y: 14 }; // left field foul line far end
const RF_END = { x: W - 8,   y: 30 }; // right field foul line far end (camera side, shorter)
const CF_MID = { x: 82,      y: 10 }; // center of outfield wall

// MLB spray coord home plate is ~(125, 205), foul lines at x≈33 and x≈217
const SPRAY_HOME = { x: 125, y: 205 };

interface Props {
  launchAngle: number;
  distance: number;
  exitVelo: number | null;
  venue: string;
  index: number;
  coordX?: number | null;
  coordY?: number | null;
}

/**
 * Convert spray coords + distance into a perspective SVG landing position.
 * Uses spray coords for lateral direction, totalDistance for depth.
 */
function getLanding(distance: number, coordX?: number | null, coordY?: number | null) {
  let lat = 0;
  if (coordX != null && coordY != null) {
    const dx = coordX - SPRAY_HOME.x;
    const dy = SPRAY_HOME.y - coordY; // flip y: positive = into field
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      lat = Math.max(-1, Math.min(1, (dx / len) / 0.707));
    }
  }

  const t = (lat + 1) / 2; // 0 = LF, 0.5 = CF, 1 = RF
  const wallX = LF_END.x + (RF_END.x - LF_END.x) * t;
  const wallY = LF_END.y + (RF_END.y - LF_END.y) * t;
  const distFrac = Math.max(0.25, Math.min(1, (distance - 270) / 220));

  return {
    x: HOME.x + (wallX - HOME.x) * distFrac,
    y: HOME.y + (wallY - HOME.y) * distFrac,
    lat,
  };
}

/** Sample a cubic bezier at parameter t (0–1). */
function bezierPt(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * x0 + 3 * mt ** 2 * t * x1 + 3 * mt * t ** 2 * x2 + t ** 3 * x3,
    y: mt ** 3 * y0 + 3 * mt ** 2 * t * y1 + 3 * mt * t ** 2 * y2 + t ** 3 * y3,
  };
}

export default function HRTrajectory({ launchAngle, distance, exitVelo, venue, index, coordX, coordY }: Props) {
  const { x: landX, y: landY } = getLanding(distance, coordX, coordY);
  const pathId    = `arc-${index}`;
  const shadowId  = `shad-${index}`;
  const glowId    = `glow-${index}`;
  const blurId    = `blur-${index}`;

  // Bezier control points
  const peakH = Math.min((launchAngle / 45) * 52, 50);
  const c1 = { x: HOME.x - 10, y: HOME.y - peakH * 1.35 };
  const c2 = { x: landX + 10,  y: landY - peakH * 0.18 };
  const ballPath   = `M ${HOME.x},${HOME.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${landX},${landY}`;
  const shadowPath = `M ${HOME.x},${HOME.y} L ${landX},${landY}`;

  // Exit velo label: near apex (t=0.38)
  const tb = 0.38, mt = 1 - tb;
  const veloX = mt**3*HOME.x + 3*mt**2*tb*c1.x + 3*mt*tb**2*c2.x + tb**3*landX;
  const veloY = mt**3*HOME.y + 3*mt**2*tb*c1.y + 3*mt*tb**2*c2.y + tb**3*landY;

  // Launch angle indicator
  const cfDx = landX - HOME.x, cfDy = landY - HOME.y;
  const cfLen = Math.sqrt(cfDx * cfDx + cfDy * cfDy);
  const rad = (launchAngle * Math.PI) / 180;
  const indLen = 13;
  const indX = HOME.x + (cfDx / cfLen) * Math.cos(rad) * indLen;
  const indY = HOME.y + (cfDy / cfLen) * Math.cos(rad) * indLen - Math.sin(rad) * indLen;

  // Spark particles: sampled at t=0.2, 0.48, 0.73 along arc
  const sparks = [0.2, 0.48, 0.73].map((t) =>
    bezierPt(t, HOME.x, HOME.y, c1.x, c1.y, c2.x, c2.y, landX, landY)
  );

  // Glow / arc color by exit velo
  const glowColor =
    exitVelo != null && exitVelo >= 115 ? "#f97316"   // orange — scorching
    : exitVelo != null && exitVelo >= 110 ? "#fbbf24" // amber — very hot
    : "#818cf8";                                       // indigo — default premium look

  // Physics-based easing:
  //   ball spends 58% of time climbing (decelerating against gravity)
  //   and 42% descending (accelerating with gravity)
  const pKT  = "0;0.58;1";      // keyTimes
  const pKP  = "0;0.5;1";       // keyPoints (half path each segment)
  const pKS  = "0.42 0 0.65 0.25;0.35 0.75 0.58 1"; // keySplines: ease-out up, ease-in down

  const begin    = "0.05s";
  const dur      = "1.2s";
  const landAt   = "1.25s";  // begin + dur

  // Approximate absolute begin times for sparks (ball passes these arc positions):
  //   t=0.20 path → ~0.37s; t=0.48 → ~0.74s; t=0.73 → ~0.95s
  const sparkBegins = ["0.37s", "0.74s", "0.95s"];

  return (
    <div className="mt-2 select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-hidden="true">
        <defs>
          <path id={pathId}   d={ballPath} />
          <path id={shadowId} d={shadowPath} />

          {/* Soft blur for glow halo on ball and arc */}
          <filter id={blurId} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>

          {/* Sharper glow for arc outline */}
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Field ──────────────────────────────────────────── */}

        {/* Outfield wall arc */}
        <path
          d={`M ${LF_END.x},${LF_END.y} Q ${CF_MID.x},${CF_MID.y} ${RF_END.x},${RF_END.y}`}
          fill="none" stroke="#27272a" strokeWidth="0.8"
        />

        {/* Foul lines */}
        <line x1={HOME.x} y1={HOME.y} x2={LF_END.x} y2={LF_END.y} stroke="#27272a" strokeWidth="0.75" />
        <line x1={HOME.x} y1={HOME.y} x2={RF_END.x} y2={RF_END.y} stroke="#27272a" strokeWidth="0.75" />

        {/* Static ground shadow line (very dim) */}
        <path d={shadowPath} fill="none" stroke="#27272a" strokeWidth="0.75" strokeDasharray="2.5 2" />

        {/* ── Moving ground shadow ───────────────────────────── */}
        {/* Ellipse tracks the ball's footprint; fades out near landing */}
        <ellipse rx="4.5" ry="1.8" fill="#000" opacity="0">
          <animate attributeName="opacity"
            values="0;0;0.55;0.55;0" keyTimes="0;0.04;0.08;0.86;1"
            dur={dur} begin={begin} fill="freeze" />
          <animateMotion dur={dur} begin={begin} fill="freeze" calcMode="linear">
            <mpath href={`#${shadowId}`} />
          </animateMotion>
        </ellipse>

        {/* ── Home plate ─────────────────────────────────────── */}
        <polygon
          points={`${HOME.x},${HOME.y-3.5} ${HOME.x+3},${HOME.y} ${HOME.x},${HOME.y+2} ${HOME.x-3},${HOME.y}`}
          fill="#3f3f46"
        />

        {/* ── Launch angle indicator ─────────────────────────── */}
        <line x1={HOME.x} y1={HOME.y} x2={indX} y2={indY}
          stroke="#52525b" strokeWidth="1" strokeLinecap="round" />
        <text x={indX - 10} y={indY - 3} fill="#a1a1aa" fontSize="5.5"
          stroke="#18181b" strokeWidth="2.5" paintOrder="stroke fill">{launchAngle}°</text>

        {/* ── Trajectory arc ─────────────────────────────────── */}

        {/* Glow arc underneath (blurred, colored) */}
        <path d={ballPath} fill="none" stroke={glowColor} strokeWidth="3.5" opacity="0"
          filter={`url(#${blurId})`}
          pathLength="1" strokeDasharray="1" strokeDashoffset="1">
          <animate attributeName="stroke-dashoffset" values="1;0.5;0"
            keyTimes={pKT} calcMode="spline" keySplines={pKS}
            dur={dur} begin={begin} fill="freeze" />
          <animate attributeName="opacity" values="0;0.55;0.55" keyTimes="0;0.04;1"
            dur={dur} begin={begin} fill="freeze" />
        </path>

        {/* Main arc (bright, sharp) */}
        <path d={ballPath} fill="none" stroke="#e4e4e7" strokeWidth="1.2"
          filter={`url(#${glowId})`}
          pathLength="1" strokeDasharray="1" strokeDashoffset="1">
          <animate attributeName="stroke-dashoffset" values="1;0.5;0"
            keyTimes={pKT} calcMode="spline" keySplines={pKS}
            dur={dur} begin={begin} fill="freeze" />
        </path>

        {/* ── Spark particles ────────────────────────────────── */}
        {/* Brief expanding flashes at sampled points as ball passes through */}
        {sparks.map(({ x, y }, i) => (
          <circle key={i} cx={x} cy={y} r="1" fill={glowColor} opacity="0">
            <animate attributeName="opacity" values="0;0.85;0"
              keyTimes="0;0.12;1" dur="0.45s" begin={sparkBegins[i]} fill="freeze" />
            <animate attributeName="r" from="1" to="5.5" dur="0.45s" begin={sparkBegins[i]} fill="freeze" />
          </circle>
        ))}

        {/* ── Ball ───────────────────────────────────────────── */}

        {/* Glow halo (blurred, colored) */}
        <circle r="8" fill={glowColor} opacity="0" filter={`url(#${blurId})`} cx={HOME.x} cy={HOME.y}>
          <animate attributeName="opacity" values="0;0;0.75;0.75;0"
            keyTimes="0;0.04;0.07;0.82;1"
            dur={dur} begin={begin} fill="freeze" />
          <animateMotion dur={dur} begin={begin} fill="freeze"
            calcMode="spline" keyTimes={pKT} keyPoints={pKP} keySplines={pKS}>
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>

        {/* Ball (solid white; fades out just before landing dot) */}
        <circle r="3.5" fill="#f4f4f5" cx={HOME.x} cy={HOME.y} opacity="0">
          <animate attributeName="opacity" values="0;1;1;0"
            keyTimes="0;0.05;0.82;1"
            dur={dur} begin={begin} fill="freeze" />
          <animateMotion dur={dur} begin={begin} fill="freeze"
            calcMode="spline" keyTimes={pKT} keyPoints={pKP} keySplines={pKS}>
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>

        {/* ── Exit velo label (near apex) ────────────────────── */}
        {exitVelo != null && (
          <text x={veloX - 2} y={veloY - 5} textAnchor="middle" fill="#a1a1aa" fontSize="6" opacity="0"
            stroke="#18181b" strokeWidth="2.5" paintOrder="stroke fill">
            {exitVelo} mph
            <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.72s" fill="freeze" />
          </text>
        )}

        {/* ── Landing ────────────────────────────────────────── */}

        {/* Flash on impact */}
        <circle cx={landX} cy={landY} r="2.5" fill="white" opacity="0">
          <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.05;1" dur="0.3s" begin={landAt} fill="freeze" />
          <animate attributeName="r" from="2.5" to="8" dur="0.3s" begin={landAt} fill="freeze" />
        </circle>

        {/* Outer ring */}
        <circle cx={landX} cy={landY} r="2.5" fill="none" stroke="#e4e4e7" strokeWidth="1.2" opacity="0">
          <animate attributeName="opacity" values="0;0.9;0" keyTimes="0;0.08;1" dur="0.65s" begin={landAt} fill="freeze" />
          <animate attributeName="r" from="2.5" to="15" dur="0.65s" begin={landAt} fill="freeze" />
          <animate attributeName="stroke-width" from="1.2" to="0.2" dur="0.65s" begin={landAt} fill="freeze" />
        </circle>

        {/* Inner ring */}
        <circle cx={landX} cy={landY} r="2.5" fill="none" stroke="#71717a" strokeWidth="0.9" opacity="0">
          <animate attributeName="opacity" values="0;0.6;0" keyTimes="0;0.12;1" dur="0.45s" begin={landAt} fill="freeze" />
          <animate attributeName="r" from="2.5" to="9" dur="0.45s" begin={landAt} fill="freeze" />
        </circle>

        {/* Landing dot */}
        <circle cx={landX} cy={landY} r="2.5" fill="#d4d4d8" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.1s" begin={landAt} fill="freeze" />
        </circle>

        {/* Distance label */}
        <text x={landX} y={landY + 10} textAnchor="middle" fill="#a1a1aa" fontSize="5.5" opacity="0"
          stroke="#18181b" strokeWidth="2.5" paintOrder="stroke fill">
          {distance} ft
          <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin={landAt} fill="freeze" />
        </text>

        {/* Venue */}
        <text x={W / 2} y={H - 1} textAnchor="middle" fill="#3f3f46" fontSize="5" fontStyle="italic">
          {venue}
        </text>
      </svg>
    </div>
  );
}
