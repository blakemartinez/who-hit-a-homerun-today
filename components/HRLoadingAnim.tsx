// Shared loading animation — used by app/loading.tsx and DatePicker overlay

const HOME   = { x: 155, y: 86 };
const LF_END = { x: 14,  y: 14 };
const RF_END = { x: 177, y: 30 };
const CF_MID = { x: 82,  y: 10 };
const C1     = { x: 145, y: 10 };
const C2     = { x: 75,  y: 22 };
const LAND   = { x: 70,  y: 28 };
const DUR    = "2s";

const BALL_PATH = `M ${HOME.x},${HOME.y} C ${C1.x},${C1.y} ${C2.x},${C2.y} ${LAND.x},${LAND.y}`;

export default function HRLoadingAnim() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-64">
        <svg viewBox="0 0 185 100" aria-hidden="true">
          <defs>
            <path id="lp" d={BALL_PATH} />
          </defs>

          {/* Outfield wall */}
          <path
            d={`M ${LF_END.x},${LF_END.y} Q ${CF_MID.x},${CF_MID.y} ${RF_END.x},${RF_END.y}`}
            fill="none" stroke="#27272a" strokeWidth="0.8"
          />

          {/* Foul lines */}
          <line x1={HOME.x} y1={HOME.y} x2={LF_END.x} y2={LF_END.y} stroke="#27272a" strokeWidth="0.75" />
          <line x1={HOME.x} y1={HOME.y} x2={RF_END.x} y2={RF_END.y} stroke="#27272a" strokeWidth="0.75" />

          {/* Ground shadow */}
          <path
            d={`M ${HOME.x},${HOME.y} L ${LAND.x},${LAND.y}`}
            fill="none" stroke="#27272a" strokeWidth="0.75" strokeDasharray="2.5 2"
          />

          {/* Home plate */}
          <polygon
            points={`${HOME.x},${HOME.y - 3.5} ${HOME.x + 3},${HOME.y} ${HOME.x},${HOME.y + 2} ${HOME.x - 3},${HOME.y}`}
            fill="#3f3f46"
          />

          {/* Arc draws itself then resets */}
          <path
            d={BALL_PATH}
            fill="none" stroke="#3f3f46" strokeWidth="1.25"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="1;0;0;1"
              keyTimes="0;0.6;0.82;1"
              dur={DUR} repeatCount="indefinite"
            />
          </path>

          {/* Trail dot */}
          <circle r="2" fill="#52525b" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0;0.45;0.45;0"
              keyTimes="0;0.07;0.14;0.76;0.88"
              dur={DUR} repeatCount="indefinite"
            />
            {/* Slightly behind the main ball — same easing, offset start */}
            <animateMotion
              dur={DUR}
              begin="-0.09s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.45;1"
              keyPoints="0;0.7;1"
              keySplines="0.5 0 0.9 0.5;0.1 0.5 0.5 1"
            >
              <mpath href="#lp" />
            </animateMotion>
          </circle>

          {/* Main ball — fast launch, slows at apex, picks up on descent */}
          <circle r="3.5" fill="#e4e4e7" opacity="0">
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.06;0.78;0.9"
              dur={DUR} repeatCount="indefinite"
            />
            <animateMotion
              dur={DUR}
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.45;1"
              keyPoints="0;0.7;1"
              keySplines="0.5 0 0.9 0.5;0.1 0.5 0.5 1"
            >
              <mpath href="#lp" />
            </animateMotion>
          </circle>

          {/* Landing pulse */}
          <circle cx={LAND.x} cy={LAND.y} r="2.5" fill="none" stroke="#52525b" strokeWidth="1" opacity="0">
            <animate
              attributeName="opacity"
              values="0;0;0.7;0"
              keyTimes="0;0.78;0.82;1"
              dur={DUR} repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2.5;2.5;9;9"
              keyTimes="0;0.78;1;1"
              dur={DUR} repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      <p className="text-zinc-700 text-xs tracking-widest">loading...</p>
    </div>
  );
}
