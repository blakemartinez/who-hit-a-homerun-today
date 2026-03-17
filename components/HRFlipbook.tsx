"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlayerHRDetail, HRGameLogEntry } from "@/lib/mlb";
import HRTrajectory from "@/components/HRTrajectory";
import HRSprayMap from "@/components/HRSprayMap";
import PitchZoneMap from "@/components/PitchZoneMap";
import PitchTypeBreakdown from "@/components/PitchTypeBreakdown";
import { addSuffix } from "@/lib/utils";

// ── Flag system ───────────────────────────────────────────────────────────────

type Flag = "red" | "orange" | "amber" | "blue";

const BORDER: Record<Flag, string> = {
  red:    "border-red-600",
  orange: "border-yellow-500",
  amber:  "border-purple-600",
  blue:   "border-blue-600",
};
const RING: Record<Flag, string> = {
  red:    "ring-red-700",
  orange: "ring-yellow-400",
  amber:  "ring-purple-500",
  blue:   "ring-blue-500",
};
const OUTLINE: Record<Flag, string> = {
  red:    "outline-red-600",
  orange: "outline-yellow-500",
  amber:  "outline-purple-600",
  blue:   "outline-blue-600",
};
const DOT_COLOR: Record<Flag, string> = {
  red:    "bg-red-600",
  orange: "bg-yellow-500",
  amber:  "bg-purple-500",
  blue:   "bg-blue-500",
};
const FLAG_LABEL: Record<Flag, string> = {
  red:    "moonshot",
  orange: "scorcher",
  amber:  "multi-HR",
  blue:   "clutch",
};

function getHRFlags(hr: PlayerHRDetail, isMultiHR: boolean): Flag[] {
  const flags: Flag[] = [];
  if ((hr.distance        ?? 0) >= 450) flags.push("red");
  if ((hr.exitVelo        ?? 0) >= 110) flags.push("orange");
  if (isMultiHR)                        flags.push("amber");
  if ((hr.captivatingIndex ?? 0) >= 80) flags.push("blue");
  return flags;
}

// ── Excitement bar ────────────────────────────────────────────────────────────

const SEGMENT_COLORS = [
  "bg-amber-950", "bg-amber-900", "bg-amber-800", "bg-amber-700",
  "bg-amber-600", "bg-amber-500", "bg-amber-400",
  "bg-yellow-400", "bg-yellow-300", "bg-yellow-200",
];

function ExcitementBar({ score }: { score: number }) {
  const filled = Math.round(score / 10);
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-600 text-xs shrink-0">excitement</span>
      <div className="flex gap-px">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={`w-2 h-1.5 rounded-sm ${i < filled ? SEGMENT_COLORS[i] : "bg-zinc-800"}`} />
        ))}
      </div>
      <span className="text-zinc-500 text-xs tabular-nums">{score}</span>
      <div className="relative group shrink-0">
        <span className="text-zinc-700 text-xs border border-zinc-700 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center cursor-default leading-none">?</span>
        <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-10 w-52 rounded bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 leading-snug">
          MLB&apos;s captivating index — 0–100 score for how exciting this play was in game context.
        </div>
      </div>
    </div>
  );
}

// ── Pitch abbreviations ───────────────────────────────────────────────────────

const PITCH_SHORT: Record<string, string> = {
  "Four-Seam Fastball": "4-seam FB",
  "Two-Seam Fastball":  "2-seam FB",
  "Sinker":             "sinker",
  "Cutter":             "cutter",
  "Slider":             "slider",
  "Sweeper":            "sweeper",
  "Curveball":          "curveball",
  "Knuckle Curve":      "knuckle curve",
  "Changeup":           "changeup",
  "Splitter":           "splitter",
  "Forkball":           "forkball",
  "Knuckleball":        "knuckleball",
  "Eephus":             "eephus",
};

function shortPitch(type: string) { return PITCH_SHORT[type] ?? type.toLowerCase(); }
function runsLabel(rbi: number)   { return rbi === 1 ? "Solo" : rbi === 4 ? "Grand Slam" : `${rbi}-run`; }
function shortDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function ordinal(n: number) { return ["1st","2nd","3rd"][n-1] ?? `${n}th`; }

// ── Types ─────────────────────────────────────────────────────────────────────

interface GameGroup {
  gamePk: number;
  date: string;
  opponent: string;
  isHome: boolean;
  hrs: Array<PlayerHRDetail & { flatIdx: number }>;
  isMultiHR: boolean;
  gameFlags: Flag[];  // combined flags for the whole game (for nav dot)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HRFlipbook({
  hrs,
  hrLog,
  displaySeason,
}: {
  hrs: PlayerHRDetail[];
  hrLog: HRGameLogEntry[];
  displaySeason: number;
}) {
  const [gameIdx, setGameIdx] = useState(0);
  const [subIdx, setSubIdx]   = useState(0);

  if (hrs.length === 0) return null;

  // Build game groups (preserving hrLog order, which is most-recent-first)
  const groupMap = new Map<number, GameGroup>();
  hrs.forEach((hr, flatIdx) => {
    if (!groupMap.has(hr.gamePk)) {
      groupMap.set(hr.gamePk, {
        gamePk:    hr.gamePk,
        date:      hr.date,
        opponent:  hr.opponent,
        isHome:    hr.isHome,
        hrs:       [],
        isMultiHR: false,
        gameFlags: [],
      });
    }
    groupMap.get(hr.gamePk)!.hrs.push({ ...hr, flatIdx });
  });
  const groups: GameGroup[] = hrLog
    .map((e) => groupMap.get(e.gamePk))
    .filter((g): g is GameGroup => g != null);
  groups.forEach((g) => {
    g.isMultiHR = g.hrs.length > 1;
    // Combined game flags = union of all HRs' flags
    const flagSet = new Set<Flag>();
    g.hrs.forEach((h) => getHRFlags(h, g.isMultiHR).forEach((f) => flagSet.add(f)));
    g.gameFlags = [...flagSet];
  });

  if (groups.length === 0) return null;

  const safeGameIdx = Math.min(gameIdx, groups.length - 1);
  const group = groups[safeGameIdx];
  const safeSub = Math.min(subIdx, group.hrs.length - 1);
  const hr = group.hrs[safeSub];
  const isMultiHR = group.isMultiHR;
  const venue = `${hr.isHome ? "vs" : "@"} ${hr.opponent}`;
  const activeFlags = getHRFlags(hr, isMultiHR);

  function goToGame(i: number) { setGameIdx(i); setSubIdx(0); }
  function jumpToGamePk(gamePk: number) {
    const i = groups.findIndex((g) => g.gamePk === gamePk);
    if (i !== -1) goToGame(i);
  }

  // Border = flags of the active individual HR
  const borderClass  = activeFlags.length > 0 ? BORDER[activeFlags[0]]  : "border-zinc-800";
  const ringClass    = activeFlags.length > 1 ? `ring-2 ring-offset-2 ring-offset-zinc-950 ${RING[activeFlags[1]]}` : "";
  const outlineClass = activeFlags.length > 2 ? `outline outline-2 outline-offset-2 ${OUTLINE[activeFlags[2]]}` : "";

  return (
    <div>
      {/* ── Header card ── */}
      <div className={`bg-zinc-900 border-2 rounded-lg p-4 mb-3 ${borderClass} ${ringClass} ${outlineClass}`}>

        {/* Game navigation */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-600 tracking-widest uppercase">
            game {safeGameIdx + 1} <span className="text-zinc-700">of {groups.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToGame(Math.max(0, safeGameIdx - 1))}
              disabled={safeGameIdx === 0}
              className="text-zinc-500 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-default transition-colors px-1"
              aria-label="Previous game"
            >←</button>

            {/* One dot per game, colored by combined game flags — windowed to max 15 */}
            {(() => {
              const MAX = 15;
              const total = groups.length;
              let winStart = 0, winEnd = total;
              if (total > MAX) {
                const half = Math.floor(MAX / 2);
                winStart = Math.max(0, Math.min(safeGameIdx - half, total - MAX));
                winEnd = winStart + MAX;
              }
              return (
                <div className="flex gap-1 items-center">
                  {winStart > 0 && (
                    <button
                      onClick={() => goToGame(winStart - 1)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs tabular-nums leading-none transition-colors"
                      aria-label={`${winStart} more games`}
                    >+{winStart}</button>
                  )}
                  {groups.slice(winStart, winEnd).map((g, relI) => {
                    const i = winStart + relI;
                    const isActive = i === safeGameIdx;
                    const color = isActive
                      ? "bg-zinc-200"
                      : g.gameFlags.length > 0
                      ? DOT_COLOR[g.gameFlags[0]]
                      : "bg-zinc-700";
                    return (
                      <button
                        key={g.gamePk}
                        onClick={() => goToGame(i)}
                        className={`rounded-full transition-all ${isActive ? "w-2 h-2" : "w-1.5 h-1.5 hover:scale-125"} ${color}`}
                        aria-label={`Game ${i + 1}`}
                      />
                    );
                  })}
                  {winEnd < total && (
                    <button
                      onClick={() => goToGame(winEnd)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs tabular-nums leading-none transition-colors"
                      aria-label={`${total - winEnd} more games`}
                    >+{total - winEnd}</button>
                  )}
                </div>
              );
            })()}

            <button
              onClick={() => goToGame(Math.min(groups.length - 1, safeGameIdx + 1))}
              disabled={safeGameIdx === groups.length - 1}
              className="text-zinc-500 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-default transition-colors px-1"
              aria-label="Next game"
            >→</button>
          </div>
        </div>

        {/* Game context — shared across all HRs in this game */}
        <p className="text-zinc-400 text-sm font-medium">
          {shortDate(hr.date)}
          <span className="text-zinc-600 mx-1.5">·</span>
          {venue}
        </p>

        {/* Multi-HR sub-toggle */}
        {isMultiHR && (
          <div className="flex gap-1.5 mt-2.5">
            {group.hrs.map((h, i) => {
              const hrFlags = getHRFlags(h, true);
              return (
                <button
                  key={i}
                  onClick={() => setSubIdx(i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    i === safeSub
                      ? "border-zinc-400 text-zinc-200 bg-zinc-800"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {ordinal(i + 1)} HR
                  {hrFlags.length > 0 && (
                    <span className={`ml-1.5 w-1.5 h-1.5 rounded-full ${DOT_COLOR[hrFlags[0]]} inline-block`} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Per-HR context */}
        <p className="text-zinc-500 text-xs mt-2">
          {hr.isTopInning ? "Top" : "Bot"} {addSuffix(hr.inning)}
          <span className="text-zinc-700 mx-1.5">·</span>
          <span className="text-zinc-300">{runsLabel(hr.rbi)}</span>
        </p>

        {/* Ball-tracking stat strip */}
        {(hr.exitVelo != null || hr.distance != null || hr.launchAngle != null || hr.pitchType != null) && (
          <div className="flex justify-between mt-3 pt-3 border-t border-zinc-800">
            {hr.exitVelo != null && (
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-sm font-bold tabular-nums ${hr.exitVelo >= 110 ? "text-yellow-400" : "text-zinc-100"}`}>{hr.exitVelo}</span>
                <span className="text-zinc-600 text-xs tracking-widest uppercase">mph</span>
                <span className="text-zinc-700 text-xs">exit velo</span>
              </div>
            )}
            {hr.distance != null && (
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-sm font-bold tabular-nums ${hr.distance >= 450 ? "text-red-400" : "text-zinc-100"}`}>{hr.distance}</span>
                <span className="text-zinc-600 text-xs tracking-widest uppercase">ft</span>
                <span className="text-zinc-700 text-xs">distance</span>
              </div>
            )}
            {hr.launchAngle != null && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold tabular-nums text-zinc-100">{hr.launchAngle}</span>
                <span className="text-zinc-600 text-xs tracking-widest uppercase">deg</span>
                <span className="text-zinc-700 text-xs">launch</span>
              </div>
            )}
            {hr.pitchType != null && (
              <div className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-sm font-bold text-zinc-100 leading-tight">{shortPitch(hr.pitchType)}</span>
                <span className="text-zinc-600 text-xs tracking-widest uppercase">
                  {hr.pitchSpeed != null ? `${hr.pitchSpeed} mph` : "pitch"}
                </span>
                <span className="text-zinc-700 text-xs">pitch</span>
              </div>
            )}
          </div>
        )}

        {/* Flag badges + excitement */}
        {(activeFlags.length > 0 || hr.captivatingIndex != null) && (
          <div className="flex items-center justify-between mt-2.5 flex-wrap gap-y-1">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {activeFlags.map((flag) => (
                <span key={flag} className="inline-flex items-center gap-1 text-xs text-zinc-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[flag]} inline-block`} />
                  {FLAG_LABEL[flag]}
                </span>
              ))}
            </div>
            {hr.captivatingIndex != null && <ExcitementBar score={hr.captivatingIndex} />}
          </div>
        )}
      </div>

      {/* ── 3-panel grid ── */}
      <div className="grid grid-cols-3 gap-2">

        {/* Trajectory */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
          <p className="text-xs text-zinc-600 tracking-widest uppercase mb-2">trajectory</p>
          {hr.launchAngle != null && hr.distance != null ? (
            <HRTrajectory
              launchAngle={hr.launchAngle}
              distance={hr.distance}
              exitVelo={hr.exitVelo}
              venue={venue}
              index={hr.flatIdx}
              coordX={hr.coordX}
              coordY={hr.coordY}
            />
          ) : (
            <p className="text-zinc-700 text-xs text-center py-6">no data</p>
          )}
        </div>

        {/* Spray map — active dot = current HR's flatIdx */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
          <p className="text-xs text-zinc-600 tracking-widests uppercase mb-2">landing</p>
          <HRSprayMap hrs={hrs} activeIdx={hr.flatIdx} />
        </div>

        {/* Game log */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 overflow-y-auto max-h-72">
          <p className="text-xs text-zinc-600 tracking-widest uppercase mb-2">{displaySeason}</p>
          <ul className="space-y-0.5">
            {hrLog.map((entry) => {
              const g = groupMap.get(entry.gamePk);
              if (!g) return null;
              const isActive = g.gamePk === group.gamePk;
              return (
                <li key={entry.gamePk}>
                  <button
                    onClick={() => jumpToGamePk(entry.gamePk)}
                    className={`w-full text-left py-1.5 pl-2 pr-1 rounded transition-colors border-l-2 ${
                      isActive ? "bg-zinc-800 border-zinc-400" : "border-transparent hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs truncate ${isActive ? "text-zinc-200" : "text-zinc-500"}`}>
                        {g.isMultiHR && <span className="text-purple-400 mr-1">{g.hrs.length}×</span>}
                        {shortDate(entry.date)}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {g.gameFlags.map((flag) => (
                          <span key={flag} className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[flag]} inline-block`} />
                        ))}
                        <Link
                          href={`/?date=${entry.date}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-zinc-700 hover:text-zinc-400 transition-colors text-xs ml-0.5"
                          title="View full day"
                        >↗</Link>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

      </div>

      {/* ── Pitch row ── */}
      {(hrs.some((h) => h.pitchX != null) || hrs.some((h) => h.pitchType != null)) && (
        <div className="grid grid-cols-2 gap-2 mt-2">

          {/* Pitch zone */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
            <p className="text-xs text-zinc-600 tracking-widest uppercase mb-2">zone</p>
            <PitchZoneMap hrs={hrs} activeIdx={hr.flatIdx} />
          </div>

          {/* Pitch type breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
            <p className="text-xs text-zinc-600 tracking-widest uppercase mb-2">pitch types</p>
            <PitchTypeBreakdown hrs={hrs} activePitchType={hr.pitchType} />
          </div>

        </div>
      )}
    </div>
  );
}
