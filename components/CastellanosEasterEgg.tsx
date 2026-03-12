"use client";

import { useState, useEffect, useCallback } from "react";
import HRLoadingAnim from "./HRLoadingAnim";
import { playerImageUrl } from "@/lib/utils";

type Phase = "intro" | "apology" | "hr_call" | "homerun" | "punchline";

// Thom's apology before the pivot
const APOLOGY_WORDS: { text: string; hold: number }[] = [
  { text: "Um,",      hold: 340 },
  { text: "I",        hold: 150 },
  { text: "made",     hold: 190 },
  { text: "a",        hold: 120 },
  { text: "comment",  hold: 210 },
  { text: "earlier",  hold: 190 },
  { text: "tonight",  hold: 210 },
  { text: "that",     hold: 150 },
  { text: "I",        hold: 140 },
  { text: "guess",    hold: 210 },
  { text: "went",     hold: 180 },
  { text: "out",      hold: 160 },
  { text: "over",     hold: 180 },
  { text: "the",      hold: 140 },
  { text: "air",      hold: 200 },
  { text: "that",     hold: 150 },
  { text: "I",        hold: 140 },
  { text: "am",       hold: 180 },
  { text: "deeply",   hold: 260 },
  { text: "ashamed",  hold: 280 },
  { text: "of.",      hold: 620 },
  { text: "If",       hold: 160 },
  { text: "I",        hold: 140 },
  { text: "have",     hold: 160 },
  { text: "hurt",     hold: 230 },
  { text: "anyone",   hold: 220 },
  { text: "out",      hold: 160 },
  { text: "there,",   hold: 310 },
  { text: "I",        hold: 150 },
  { text: "can't",    hold: 210 },
  { text: "tell",     hold: 190 },
  { text: "you",      hold: 160 },
  { text: "how",      hold: 190 },
  { text: "much",     hold: 210 },
  { text: "I",        hold: 140 },
  { text: "say",      hold: 180 },
  { text: "from",     hold: 170 },
  { text: "the",      hold: 140 },
  { text: "bottom",   hold: 210 },
  { text: "of",       hold: 140 },
  { text: "my",       hold: 160 },
  { text: "heart,",   hold: 420 },
  { text: "I'm",      hold: 190 },
  { text: "so",       hold: 190 },
  { text: "very,",    hold: 230 },
  { text: "very",     hold: 230 },
  { text: "sorry.",   hold: 720 },
  { text: "I",        hold: 160 },
  { text: "pride",    hold: 210 },
  { text: "myself",   hold: 210 },
  { text: "and",      hold: 150 },
  { text: "think",    hold: 200 },
  { text: "of",       hold: 140 },
  { text: "myself",   hold: 200 },
  { text: "as",       hold: 160 },
  { text: "a",        hold: 140 },
  { text: "man",      hold: 230 },
  { text: "of",       hold: 180 },
  { text: "faith—",   hold: 1400 }, // long dramatic pause before the pivot
];

// The call itself — plays while the ball animation runs
const HR_WORDS: { text: string; hold: number }[] = [
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

// Trajectory SVG coords (same perspective system as HRTrajectory.tsx)
const HOME   = { x: 155, y: 86 };
const LF_END = { x: 14,  y: 14 };
const RF_END = { x: 177, y: 30 };
const CF_MID = { x: 82,  y: 10 };
const LAND   = { x: 70,  y: 28 };
const C1     = { x: 145, y: 42 };
const C2     = { x: 80,  y: 22 };
const BALL_PATH = `M ${HOME.x},${HOME.y} C ${C1.x},${C1.y} ${C2.x},${C2.y} ${LAND.x},${LAND.y}`;
const THOM   = { x: 170, y: 91 };

// ── Helpers ──────────────────────────────────────────────────────────────────

function useKaraoke(words: { text: string; hold: number }[], active: boolean, onDone: () => void) {
  const [idx, setIdx] = useState(-1);

  useEffect(() => {
    if (!active) return;
    setIdx(0);
    let i = 0;
    let t: ReturnType<typeof setTimeout>;

    function step() {
      setIdx(i);
      if (i < words.length - 1) {
        t = setTimeout(() => { i++; step(); }, words[i].hold);
      } else {
        t = setTimeout(onDone, words[i].hold);
      }
    }

    step();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return idx;
}

function KaraokeText({
  words,
  activeIdx,
  size = "text-xl sm:text-2xl",
}: {
  words: { text: string }[];
  activeIdx: number;
  size?: string;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-x-[0.35em] gap-y-2">
      {words.map(({ text }, i) => (
        <span
          key={i}
          className={`${size} font-bold transition-colors duration-100 ${
            i < activeIdx  ? "text-zinc-600"
            : i === activeIdx ? "text-white"
            : "text-zinc-800"
          }`}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

function MiniLegend({ items }: { items: { dot: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-zinc-800">
      {items.map(({ dot, label }) => (
        <span key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className={`w-2.5 h-2.5 rounded-sm border-2 ${dot} inline-block`} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Castellanos card ─────────────────────────────────────────────────────────

function CastellanosCard() {
  return (
    <div className="bg-zinc-900 border-2 border-emerald-600 rounded-lg p-4 ring-2 ring-offset-4 ring-offset-zinc-950 ring-red-700 outline outline-2 outline-offset-4 outline-blue-600">
      <div className="flex flex-col items-center mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerImageUrl(592206)}
          alt="Nick Castellanos"
          className="w-20 h-20 rounded-full object-cover bg-zinc-800 border border-zinc-700 mb-2"
        />
        <p className="text-zinc-100 font-bold text-sm text-center leading-tight">Nick Castellanos</p>
        <p className="text-zinc-500 text-xs mt-0.5">Cincinnati Reds · RF</p>
      </div>

      <div className="border-t border-zinc-800 mb-3" />

      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-zinc-200 text-xs font-medium">Top 5 · solo</p>
            <p className="text-emerald-600 text-xs mt-0.5">★ most on-brand HR ever</p>
            <div className="flex gap-3 mt-0.5">
              <span className="text-xs text-red-600">↑ deep left-center</span>
              <span className="text-xs text-blue-500">→ impeccable timing</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-zinc-600 text-xs italic">4-seam FB</p>
            <p className="text-zinc-700 text-xs">Greg Holland</p>
          </div>
        </div>

        {/* Trajectory */}
        <svg viewBox="0 0 185 100" className="w-full mt-2" aria-hidden="true">
          <path d={`M ${LF_END.x},${LF_END.y} Q ${CF_MID.x},${CF_MID.y} ${RF_END.x},${RF_END.y}`}
            fill="none" stroke="#27272a" strokeWidth="0.8" />
          <line x1={HOME.x} y1={HOME.y} x2={LF_END.x} y2={LF_END.y} stroke="#27272a" strokeWidth="0.75" />
          <line x1={HOME.x} y1={HOME.y} x2={RF_END.x} y2={RF_END.y} stroke="#27272a" strokeWidth="0.75" />
          <path d={`M ${HOME.x},${HOME.y} L ${LAND.x},${LAND.y}`}
            fill="none" stroke="#3f3f46" strokeWidth="0.75" strokeDasharray="2.5 2" />
          <polygon points={`${HOME.x},${HOME.y-3.5} ${HOME.x+3},${HOME.y} ${HOME.x},${HOME.y+2} ${HOME.x-3},${HOME.y}`} fill="#3f3f46" />
          <defs><path id="cast-arc" d={BALL_PATH} /></defs>
          <path d={BALL_PATH} fill="none" stroke="#a1a1aa" strokeWidth="1.5"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1">
            <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1s" begin="0.1s" fill="freeze" />
          </path>
          <circle r="3.5" fill="#e4e4e7" opacity="0">
            <animate attributeName="opacity" values="0;1" dur="0.01s" begin="0.1s" fill="freeze" />
            <animateMotion dur="1s" begin="0.1s" fill="freeze"><mpath href="#cast-arc" /></animateMotion>
          </circle>
          <circle cx={LAND.x} cy={LAND.y} r="2.5" fill="#d4d4d8" opacity="0">
            <animate attributeName="opacity" from="0" to="1" dur="0.1s" begin="1.1s" fill="freeze" />
          </circle>
          <circle cx={LAND.x} cy={LAND.y} r="2.5" fill="none" stroke="#71717a" strokeWidth="1" opacity="0">
            <animate attributeName="opacity" from="0.7" to="0" dur="0.7s" begin="1.1s" fill="freeze" />
            <animate attributeName="r" from="2.5" to="10" dur="0.7s" begin="1.1s" fill="freeze" />
          </circle>
          <text x={LAND.x - 2} y={LAND.y + 9} textAnchor="middle"
            fill="#52525b" fontSize="4" fontStyle="italic" opacity="0"
            stroke="#0a0a0a" strokeWidth="2" paintOrder="stroke fill">
            Judgement Free Zone™
            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.4s" fill="freeze" />
          </text>
          <line x1={THOM.x} y1={THOM.y} x2={HOME.x} y2={HOME.y}
            stroke="#ef4444" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.5" />
          <line x1={THOM.x-2.5} y1={THOM.y-2.5} x2={THOM.x+2.5} y2={THOM.y+2.5}
            stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
          <line x1={THOM.x+2.5} y1={THOM.y-2.5} x2={THOM.x-2.5} y2={THOM.y+2.5}
            stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
          <text x={THOM.x} y={THOM.y-5} textAnchor="middle" fill="#ef4444" fontSize="4.5"
            stroke="#0a0a0a" strokeWidth="2" paintOrder="stroke fill">Thom</text>
          <text x={THOM.x} y={THOM.y-0.5} textAnchor="middle" fill="#71717a" fontSize="3.2"
            stroke="#0a0a0a" strokeWidth="2" paintOrder="stroke fill">(mid-apology)</text>
        </svg>
      </div>

      <div className="border-t border-zinc-800 mt-3 mb-2" />
      <p className="text-zinc-600 text-xs text-center italic">HR #9 of the season</p>

      <MiniLegend items={[
        { dot: "border-emerald-600", label: "milestone" },
        { dot: "border-red-600",     label: "deep drive" },
        { dot: "border-blue-600",    label: "perfect timing" },
      ]} />
    </div>
  );
}

// ── Brennaman card ───────────────────────────────────────────────────────────

function BrennаmanCard() {
  return (
    <div className="bg-zinc-900 border-2 border-red-600 rounded-lg p-4 ring-2 ring-offset-4 ring-offset-zinc-950 ring-yellow-400 outline outline-2 outline-offset-4 outline-purple-600">
      <div className="flex flex-col items-center mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.statesmanjournal.com/gcdn/presto/2020/08/20/PCIN/05e0c613-2286-4592-b077-5ad99bce932c-thumbnail.png?crop=980,552,x0,y0&width=980&height=552&format=pjpg&auto=webp"
          alt="Thom Brennaman"
          className="w-20 h-20 rounded-full object-cover object-top bg-zinc-800 border border-zinc-700 mb-2"
        />
        <p className="text-zinc-100 font-bold text-sm text-center leading-tight">Thom Brennaman</p>
        <p className="text-zinc-500 text-xs mt-0.5">FOX Sports · Reds Broadcaster</p>
      </div>

      <div className="border-t border-zinc-800 mb-3" />

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-zinc-200 text-xs font-medium">T5 · Live Broadcast</p>
            <p className="text-emerald-600 text-xs mt-0.5">★ mid-apology, on live TV</p>
            <div className="flex gap-3 mt-0.5">
              <span className="text-xs text-red-600">↑ irreversible</span>
              <span className="text-xs text-yellow-500">→ 100% cringe</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-zinc-600 text-xs italic">sinker</p>
            <p className="text-zinc-700 text-xs">(apologetic)</p>
          </div>
        </div>

        <div className="mt-2 space-y-1 text-xs text-zinc-600">
          <div className="flex justify-between gap-3">
            <span>apologies started</span>
            <span className="text-zinc-400">1</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>apologies completed</span>
            <span className="text-red-600 font-medium">0</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>mic status at time</span>
            <span className="text-red-500 font-medium">HOT</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>faith invoked on-air</span>
            <span className="text-yellow-500">yes</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>headset</span>
            <span className="text-purple-400 text-right">won&apos;t be putting back on</span>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800 mt-3 mb-2" />
      <p className="text-zinc-600 text-xs text-center italic">career-defining moment #1</p>

      <MiniLegend items={[
        { dot: "border-red-600",    label: "hot mic" },
        { dot: "border-yellow-500", label: "man of faith" },
        { dot: "border-purple-600", label: "incomplete apology" },
      ]} />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CastellanosEasterEgg() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  const dismiss = useCallback(() => {
    setFading(true);
    setTimeout(() => setDismissed(true), 600);
  }, []);

  // intro → apology
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setPhase("apology"), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  // homerun → punchline
  useEffect(() => {
    if (phase !== "homerun") return;
    const t = setTimeout(() => setPhase("punchline"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  const apologyIdx = useKaraoke(APOLOGY_WORDS, phase === "apology", () => setPhase("hr_call"));
  const hrIdx      = useKaraoke(HR_WORDS,      phase === "hr_call",  () => setPhase("homerun"));

  if (dismissed) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-zinc-950 font-mono overflow-y-auto transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="min-h-full flex flex-col items-center justify-center py-10 px-4 gap-8">

        {/* ── INTRO ───────────────────────────────── */}
        {phase === "intro" && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 text-red-500 text-xs tracking-widest uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Live Broadcast — Cincinnati Reds
            </div>
            <HRLoadingAnim />
          </div>
        )}

        {/* ── APOLOGY KARAOKE ─────────────────────── */}
        {phase === "apology" && (
          <div className="w-full max-w-xl text-center">
            <p className="text-xs text-zinc-600 tracking-widest uppercase mb-8">
              Thom Brennaman — on-air apology, August 19, 2020
            </p>
            <KaraokeText words={APOLOGY_WORDS} activeIdx={apologyIdx} size="text-xl sm:text-2xl" />
          </div>
        )}

        {/* ── HR CALL KARAOKE (ball animation above) ── */}
        {phase === "hr_call" && (
          <div className="w-full max-w-lg text-center flex flex-col items-center gap-6">
            <HRLoadingAnim />
            <KaraokeText words={HR_WORDS} activeIdx={hrIdx} size="text-2xl sm:text-3xl" />
          </div>
        )}

        {/* ── HOME RUN EXCLAIM ────────────────────── */}
        {phase === "homerun" && (
          <div className="flex flex-col items-center gap-8">
            <p className="text-6xl font-black text-white tracking-tight animate-bounce">HOME RUN!</p>
            <HRLoadingAnim />
          </div>
        )}

        {/* ── PUNCHLINE: two cards ─────────────────── */}
        {phase === "punchline" && (
          <>
            <p className="text-xs text-zinc-600 tracking-widest uppercase text-center">
              Kauffman Stadium · August 19, 2020 · Game 2
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl">
              <CastellanosCard />
              <BrennаmanCard />
            </div>
            <button
              onClick={dismiss}
              className="mt-2 px-6 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
              continue to the stats →
            </button>
          </>
        )}

      </div>
    </div>
  );
}
