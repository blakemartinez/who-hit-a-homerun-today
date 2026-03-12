"use client";

import { useState, useEffect, useCallback } from "react";
import HRLoadingAnim from "./HRLoadingAnim";
import { playerImageUrl } from "@/lib/utils";

type Phase = "intro" | "karaoke" | "homerun" | "punchline";

// The quote, word by word, with how long each word stays lit (ms) before advancing
const WORDS: { text: string; hold: number }[] = [
  { text: "And",            hold: 220 },
  { text: "there's",        hold: 200 },
  { text: "a",              hold: 140 },
  { text: "drive",          hold: 280 },
  { text: "into",           hold: 180 },
  { text: "deep",           hold: 240 },
  { text: "left",           hold: 190 },
  { text: "field",          hold: 260 },
  { text: "by",             hold: 180 },
  { text: "Castellanos...", hold: 900 },
  { text: "it",             hold: 200 },
  { text: "will",           hold: 240 },
  { text: "be",             hold: 180 },
  { text: "a",              hold: 160 },
  { text: "home",           hold: 320 },
  { text: "run.",           hold: 900 },
];

// Trajectory coords (same perspective as HRTrajectory.tsx)
// Left-center field homer from home plate
const HOME = { x: 155, y: 86 };
const LF_END = { x: 14, y: 14 };
const RF_END = { x: 177, y: 30 };
const CF_MID = { x: 82, y: 10 };
const LAND = { x: 70, y: 28 }; // deep left-center
const C1 = { x: 145, y: 42 };  // control pt 1
const C2 = { x: 80, y: 22 };   // control pt 2
const BALL_PATH = `M ${HOME.x},${HOME.y} C ${C1.x},${C1.y} ${C2.x},${C2.y} ${LAND.x},${LAND.y}`;
// Thom marker: just right of home plate (press box behind home plate)
const THOM = { x: 170, y: 91 };

export default function CastellanosEasterEgg() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [activeWord, setActiveWord] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  const dismiss = useCallback(() => {
    setFading(true);
    setTimeout(() => setDismissed(true), 600);
  }, []);

  // intro → karaoke after 1.4s
  useEffect(() => {
    const t = setTimeout(() => setPhase("karaoke"), 1400);
    return () => clearTimeout(t);
  }, []);

  // karaoke: step through each word
  useEffect(() => {
    if (phase !== "karaoke") return;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;

    function step() {
      setActiveWord(i);
      if (i < WORDS.length - 1) {
        t = setTimeout(() => { i++; step(); }, WORDS[i].hold);
      } else {
        t = setTimeout(() => setPhase("homerun"), WORDS[i].hold);
      }
    }

    step();
    return () => clearTimeout(t);
  }, [phase]);

  // homerun → punchline
  useEffect(() => {
    if (phase !== "homerun") return;
    const t = setTimeout(() => setPhase("punchline"), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  // punchline auto-dismiss after 12s (or click)
  useEffect(() => {
    if (phase !== "punchline") return;
    const t = setTimeout(dismiss, 12000);
    return () => clearTimeout(t);
  }, [phase, dismiss]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center font-mono px-6 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
      onClick={phase === "punchline" ? dismiss : undefined}
    >
      {/* ── INTRO ─────────────────────────────────── */}
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-red-500 text-xs tracking-widest uppercase animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Live Broadcast — Cincinnati Reds
          </div>
          <HRLoadingAnim />
        </div>
      )}

      {/* ── KARAOKE ───────────────────────────────── */}
      {phase === "karaoke" && (
        <div className="max-w-xl w-full text-center">
          <p className="text-xs text-zinc-600 tracking-widest uppercase mb-8">
            Thom Brennaman — Reds play-by-play, August 19, 2020
          </p>
          <p className="text-3xl font-bold leading-loose">
            {WORDS.map(({ text }, i) => (
              <span
                key={i}
                className={`mr-[0.3em] transition-colors duration-100 ${
                  i < activeWord
                    ? "text-zinc-600"
                    : i === activeWord
                    ? "text-white"
                    : "text-zinc-800"
                }`}
              >
                {text}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* ── HOME RUN ──────────────────────────────── */}
      {phase === "homerun" && (
        <div className="flex flex-col items-center gap-8">
          <p className="text-6xl font-black text-white tracking-tight animate-bounce">
            HOME RUN!
          </p>
          <HRLoadingAnim />
        </div>
      )}

      {/* ── PUNCHLINE: Castellanos card ───────────── */}
      {phase === "punchline" && (
        <div className="flex flex-col items-center gap-5 w-full max-w-sm">
          <div className="w-full bg-zinc-900 border-2 border-emerald-600 rounded-xl p-4 shadow-lg">

            {/* Player header */}
            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playerImageUrl(592206)}
                alt="Nick Castellanos"
                className="w-14 h-14 rounded-full object-cover bg-zinc-800 border border-zinc-700"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-base leading-tight">Nick Castellanos</div>
                <div className="text-zinc-500 text-xs mt-0.5">Cincinnati Reds · RF</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-500 font-black text-xl leading-none">HR #9</div>
                <div className="text-zinc-600 text-xs mt-0.5">season</div>
              </div>
            </div>

            {/* Trajectory SVG */}
            <svg viewBox="0 0 185 100" className="w-full" aria-hidden="true">
              {/* Outfield wall */}
              <path
                d={`M ${LF_END.x},${LF_END.y} Q ${CF_MID.x},${CF_MID.y} ${RF_END.x},${RF_END.y}`}
                fill="none" stroke="#27272a" strokeWidth="0.8"
              />
              {/* Foul lines */}
              <line x1={HOME.x} y1={HOME.y} x2={LF_END.x} y2={LF_END.y} stroke="#27272a" strokeWidth="0.75" />
              <line x1={HOME.x} y1={HOME.y} x2={RF_END.x} y2={RF_END.y} stroke="#27272a" strokeWidth="0.75" />
              {/* Ground shadow */}
              <path d={`M ${HOME.x},${HOME.y} L ${LAND.x},${LAND.y}`}
                fill="none" stroke="#3f3f46" strokeWidth="0.75" strokeDasharray="2.5 2" />
              {/* Home plate */}
              <polygon
                points={`${HOME.x},${HOME.y - 3.5} ${HOME.x + 3},${HOME.y} ${HOME.x},${HOME.y + 2} ${HOME.x - 3},${HOME.y}`}
                fill="#3f3f46"
              />
              {/* Trajectory arc */}
              <path d={BALL_PATH} fill="none" stroke="#a1a1aa" strokeWidth="1.5"
                pathLength="1" strokeDasharray="1" strokeDashoffset="1">
                <animate attributeName="stroke-dashoffset" from="1" to="0"
                  dur="1s" begin="0.1s" fill="freeze" />
              </path>
              {/* Ball */}
              <circle r="3.5" fill="#e4e4e7" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.01s" begin="0.1s" fill="freeze" />
                <animateMotion dur="1s" begin="0.1s" fill="freeze">
                  <mpath href="#cast-path" />
                </animateMotion>
              </circle>
              <defs>
                <path id="cast-path" d={BALL_PATH} />
              </defs>
              {/* Landing marker */}
              <circle cx={LAND.x} cy={LAND.y} r="2.5" fill="#d4d4d8" opacity="0">
                <animate attributeName="opacity" from="0" to="1" dur="0.1s" begin="1.1s" fill="freeze" />
              </circle>
              <circle cx={LAND.x} cy={LAND.y} r="2.5" fill="none" stroke="#71717a" strokeWidth="1" opacity="0">
                <animate attributeName="opacity" from="0.7" to="0" dur="0.7s" begin="1.1s" fill="freeze" />
                <animate attributeName="r" from="2.5" to="10" dur="0.7s" begin="1.1s" fill="freeze" />
              </circle>
              {/* "Judgement Free Zone" near landing */}
              <text x={LAND.x - 2} y={LAND.y + 9} textAnchor="middle"
                fill="#52525b" fontSize="4.2" fontStyle="italic" opacity="0"
                stroke="#0a0a0a" strokeWidth="2" paintOrder="stroke fill">
                Judgement Free Zone™
                <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.3s" fill="freeze" />
              </text>

              {/* Thom marker — dotted line from press box area to home plate */}
              <line
                x1={THOM.x} y1={THOM.y}
                x2={HOME.x} y2={HOME.y}
                stroke="#ef4444" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.5"
              />
              {/* X mark */}
              <line x1={THOM.x - 2.5} y1={THOM.y - 2.5} x2={THOM.x + 2.5} y2={THOM.y + 2.5}
                stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
              <line x1={THOM.x + 2.5} y1={THOM.y - 2.5} x2={THOM.x - 2.5} y2={THOM.y + 2.5}
                stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
              {/* Label */}
              <text x={THOM.x} y={THOM.y - 5} textAnchor="middle"
                fill="#ef4444" fontSize="4.5"
                stroke="#0a0a0a" strokeWidth="2" paintOrder="stroke fill">
                Thom
              </text>
              <text x={THOM.x} y={THOM.y - 0.5} textAnchor="middle"
                fill="#71717a" fontSize="3.2"
                stroke="#0a0a0a" strokeWidth="2" paintOrder="stroke fill">
                (mid-apology)
              </text>
            </svg>

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-800">
              <span>5th inning</span>
              <span className="text-zinc-700">·</span>
              <span>solo</span>
              <span className="text-zinc-700">·</span>
              <span>off Greg Holland</span>
              <span className="text-zinc-700">·</span>
              <span>4-seam FB</span>
            </div>
          </div>

          <p className="text-zinc-700 text-xs tracking-widest uppercase">tap anywhere to continue</p>
        </div>
      )}
    </div>
  );
}
