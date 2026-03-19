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
  // Lateral fraction: -1 = LF foul line, 0 = CF, +1 = RF foul line
  let lat = 0;
  if (coordX != null && coordY != null) {
    const dx = coordX - SPRAY_HOME.x;
    const dy = SPRAY_HOME.y - coordY; // flip y: positive = into field
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      // foul lines are ~45° from center → max lateral component ≈ sin(45°) = 0.707
      lat = Math.max(-1, Math.min(1, (dx / len) / 0.707));
    }
  }

  // Interpolate wall position between LF_END and RF_END based on lateral fraction
  const t = (lat + 1) / 2; // 0 = LF, 0.5 = CF, 1 = RF
  const wallX = LF_END.x + (RF_END.x - LF_END.x) * t;
  const wallY = LF_END.y + (RF_END.y - LF_END.y) * t;

  // How far along the foul-line direction (depth into field)
  // 290ft ≈ 30% of way to wall; 480ft ≈ 100%
  const distFrac = Math.max(0.25, Math.min(1, (distance - 270) / 220));

  return {
    x: HOME.x + (wallX - HOME.x) * distFrac,
    y: HOME.y + (wallY - HOME.y) * distFrac,
    lat,
  };
}

export default function HRTrajectory({ launchAngle, distance, exitVelo, venue, index, coordX, coordY }: Props) {
  const { x: landX, y: landY } = getLanding(distance, coordX, coordY);
  const pathId = `arc-${index}`;

  // Cubic bezier: shoots up steeply from home, flattens toward landing
  // Height perspective-scales so the ball appears taller close to camera
  const peakH = Math.min((launchAngle / 45) * 52, 50);
  const c1 = { x: HOME.x - 10,        y: HOME.y - peakH * 1.35 };
  const c2 = { x: landX + 10,         y: landY - peakH * 0.18 };
  const ballPath = `M ${HOME.x},${HOME.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${landX},${landY}`;
  const shadowPath = `M ${HOME.x},${HOME.y} L ${landX},${landY}`;

  // Exit velo label: sample bezier at t=0.38 (near apex)
  const tb = 0.38, mt = 1 - tb;
  const veloX = mt**3*HOME.x + 3*mt**2*tb*c1.x + 3*mt*tb**2*c2.x + tb**3*landX;
  const veloY = mt**3*HOME.y + 3*mt**2*tb*c1.y + 3*mt*tb**2*c2.y + tb**3*landY;

  // Launch angle indicator: blend of toward-landing direction and straight up
  const cfDx = landX - HOME.x, cfDy = landY - HOME.y;
  const cfLen = Math.sqrt(cfDx*cfDx + cfDy*cfDy);
  const rad = (launchAngle * Math.PI) / 180;
  const indLen = 13;
  const indX = HOME.x + (cfDx/cfLen)*Math.cos(rad)*indLen;
  const indY = HOME.y + (cfDy/cfLen)*Math.cos(rad)*indLen - Math.sin(rad)*indLen;

  return (
    <div className="mt-2 select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-hidden="true">
        <defs>
          <path id={pathId} d={ballPath} />
        </defs>

        {/* Outfield wall arc */}
        <path
          d={`M ${LF_END.x},${LF_END.y} Q ${CF_MID.x},${CF_MID.y} ${RF_END.x},${RF_END.y}`}
          fill="none" stroke="#27272a" strokeWidth="0.8"
        />

        {/* Foul lines */}
        <line x1={HOME.x} y1={HOME.y} x2={LF_END.x} y2={LF_END.y} stroke="#27272a" strokeWidth="0.75" />
        <line x1={HOME.x} y1={HOME.y} x2={RF_END.x} y2={RF_END.y} stroke="#27272a" strokeWidth="0.75" />

        {/* Ground shadow */}
        <path d={shadowPath} fill="none" stroke="#3f3f46" strokeWidth="0.75" strokeDasharray="2.5 2" />

        {/* Home plate */}
        <polygon
          points={`${HOME.x},${HOME.y-3.5} ${HOME.x+3},${HOME.y} ${HOME.x},${HOME.y+2} ${HOME.x-3},${HOME.y}`}
          fill="#3f3f46"
        />

        {/* Launch angle indicator */}
        <line x1={HOME.x} y1={HOME.y} x2={indX} y2={indY}
          stroke="#52525b" strokeWidth="1" strokeLinecap="round" />
        <g>
          <rect x={indX - 16} y={indY - 9} width={18} height={8}
            fill="rgba(9,9,11,0.7)" rx="1" />
          <text x={indX - 7} y={indY - 3} textAnchor="middle" fill="#a1a1aa" fontSize="5.5">{launchAngle}°</text>
        </g>

        {/* Trajectory arc */}
        <path d={ballPath} fill="none" stroke="#a1a1aa" strokeWidth="1.5"
          pathLength="1" strokeDasharray="1" strokeDashoffset="1">
          <animate attributeName="stroke-dashoffset" from="1" to="0"
            dur="1s" begin="0.05s" fill="freeze" />
        </path>

        {/* Ball — fades out just before landing so the landing dot takes over */}
        <circle r="3.5" fill="#e4e4e7" cx={HOME.x} cy={HOME.y} opacity="0">
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.82;1"
            dur="1s" begin="0.05s" fill="freeze" />
          <animateMotion dur="1s" begin="0.05s" fill="freeze">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>

        {/* Exit velo near apex */}
        {exitVelo != null && (
          <g opacity="0">
            <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="0.45s" fill="freeze" />
            <rect x={veloX - 16} y={veloY - 12} width={32} height={9}
              fill="rgba(9,9,11,0.7)" rx="1" />
            <text x={veloX - 2} y={veloY - 5} textAnchor="middle" fill="#a1a1aa" fontSize="6">
              {exitVelo} mph
            </text>
          </g>
        )}

        {/* Landing: marker + pulse ring + distance label */}
        <circle cx={landX} cy={landY} r="2.5" fill="#d4d4d8" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.1s" begin="1.05s" fill="freeze" />
        </circle>
        <circle cx={landX} cy={landY} r="2.5" fill="none" stroke="#71717a" strokeWidth="1" opacity="0">
          <animate attributeName="opacity" from="0.7" to="0" dur="0.7s" begin="1.05s" fill="freeze" />
          <animate attributeName="r" from="2.5" to="10" dur="0.7s" begin="1.05s" fill="freeze" />
        </circle>
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="1.05s" fill="freeze" />
          <rect x={landX - 14} y={landY + 2} width={28} height={8}
            fill="rgba(9,9,11,0.7)" rx="1" />
          <text x={landX} y={landY + 9} textAnchor="middle" fill="#a1a1aa" fontSize="5.5">
            {distance} ft
          </text>
        </g>

        {/* Venue */}
        <text x={W/2} y={H-1} textAnchor="middle" fill="#3f3f46" fontSize="5" fontStyle="italic">
          {venue}
        </text>
      </svg>
    </div>
  );
}
