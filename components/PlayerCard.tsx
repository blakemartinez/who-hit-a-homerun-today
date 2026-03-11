"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlayerStat, HomeRunEvent } from "@/app/page";
import HRTrajectory from "@/components/HRTrajectory";

const PITCH_SHORT: Record<string, string> = {
  "Four-Seam Fastball":  "4-seam",
  "Two-Seam Fastball":   "2-seam",
  "Sinker":              "sinker",
  "Cutter":              "cutter",
  "Slider":              "slider",
  "Sweeper":             "sweeper",
  "Curveball":           "curveball",
  "Knuckle Curve":       "knuckle curve",
  "Changeup":            "changeup",
  "Splitter":            "splitter",
  "Knuckleball":         "knuckleball",
};

// Segment color ramps from dull amber → bright yellow as the bar fills
const SEGMENT_COLORS = [
  "bg-amber-950", // 10
  "bg-amber-900", // 20
  "bg-amber-800", // 30
  "bg-amber-700", // 40
  "bg-amber-600", // 50
  "bg-amber-500", // 60
  "bg-amber-400", // 70
  "bg-yellow-400", // 80
  "bg-yellow-300", // 90
  "bg-yellow-200", // 100
];

function ExcitementBar({ score }: { score: number }) {
  const filled = Math.round(score / 10);
  return (
    <div className="flex items-center gap-1.5 mt-2 mb-1">
      <div className="relative group w-16 shrink-0">
        <span className="text-zinc-600 text-xs cursor-default">
          excitement <span className="text-zinc-700">?</span>
        </span>
        <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-10 w-52 rounded bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 leading-snug">
          MLB&apos;s captivating index — a 0–100 score rating how exciting this play was in context of the game.
        </div>
      </div>
      <div className="flex gap-px">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-1.5 rounded-sm ${i < filled ? SEGMENT_COLORS[i] : "bg-zinc-800"}`}
          />
        ))}
      </div>
      <span className="text-zinc-600 text-xs">{score}</span>
    </div>
  );
}

function hasViz(hr: HomeRunEvent) {
  return hr.launchAngle != null || hr.coordX != null || hr.captivatingIndex != null;
}

function HRRow({
  hr,
  playerId,
  rowIndex,
}: {
  hr: HomeRunEvent;
  playerId: number;
  rowIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const canExpand = hasViz(hr);

  return (
    <li>
      <button
        className="w-full text-left disabled:cursor-default"
        onClick={() => canExpand && setOpen((o) => !o)}
        disabled={!canExpand}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-zinc-200 text-xs font-medium">
              {hr.topBottom} {hr.inning} &middot; {hr.runsScored}
            </p>
            {hr.milestone && (
              <p className="text-emerald-600 text-xs mt-0.5">★ {hr.milestone}</p>
            )}
            {(hr.distance != null || hr.exitVelo != null) && (
              <div className="flex gap-3 mt-0.5">
                {hr.distance != null && (
                  <span className={`text-xs ${(hr.distance ?? 0) >= 450 ? "text-red-600" : "text-zinc-600"}`}>
                    ↑ {hr.distance}ft
                  </span>
                )}
                {hr.exitVelo != null && (
                  <span className={`text-xs ${(hr.exitVelo ?? 0) >= 110 ? "text-yellow-500" : "text-zinc-600"}`}>
                    → {hr.exitVelo}mph
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hr.pitchType && (
              <div className="text-right">
                <p className="text-zinc-600 text-xs italic">
                  {PITCH_SHORT[hr.pitchType] ?? hr.pitchType.toLowerCase()}
                </p>
                {hr.pitchSpeed != null && (
                  <p className="text-zinc-700 text-xs">{hr.pitchSpeed}mph</p>
                )}
              </div>
            )}
            {canExpand && (
              <span className="text-zinc-700 text-xs">{open ? "▲" : "▼"}</span>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-1 border-t border-zinc-800 pt-2">
          {hr.captivatingIndex != null && <ExcitementBar score={hr.captivatingIndex} />}
          {hr.launchAngle != null && hr.distance != null && (
            <HRTrajectory
              launchAngle={hr.launchAngle}
              distance={hr.distance}
              exitVelo={hr.exitVelo}
              venue={hr.venue}
              index={playerId * 10 + rowIndex}
              coordX={hr.coordX}
              coordY={hr.coordY}
            />
          )}
        </div>
      )}
    </li>
  );
}

export default function PlayerCard({ player }: { player: PlayerStat }) {
  const lastHR = player.homeRuns[player.homeRuns.length - 1];
  const hrNumber = lastHR.hrNumber;
  const isPlayoffs = lastHR.isPlayoffs;
  const hasMilestone = player.homeRuns.some((hr) => hr.milestone !== null);
  const isMoonshot = player.homeRuns.some((hr) => (hr.distance ?? 0) >= 450);
  const isScorcher = player.homeRuns.some((hr) => (hr.exitVelo ?? 0) >= 110);
  const isMultiHR = player.homeRuns.length > 1;
  const isClutch = player.homeRuns.some((hr) => (hr.captivatingIndex ?? 0) >= 80);

  const BORDER: Record<string, string> = {
    emerald: "border-emerald-600",
    red: "border-red-600",
    orange: "border-yellow-500",
    amber: "border-purple-600",
    blue: "border-blue-600",
  };
  const RING: Record<string, string> = {
    emerald: "ring-emerald-600",
    red: "ring-red-700",
    orange: "ring-yellow-400",
    amber: "ring-purple-500",
    blue: "ring-blue-500",
  };

  const flags: string[] = [];
  if (hasMilestone) flags.push("emerald");
  if (isMoonshot) flags.push("red");
  if (isScorcher) flags.push("orange");
  if (isMultiHR) flags.push("amber");
  if (isClutch) flags.push("blue");

  const OUTLINE: Record<string, string> = {
    emerald: "outline-emerald-600",
    red: "outline-red-600",
    orange: "outline-yellow-500",
    amber: "outline-purple-600",
    blue: "outline-blue-600",
  };

  const borderClass = flags.length > 0 ? BORDER[flags[0]] : "border-zinc-800";
  const ringClass = flags.length > 1
    ? `ring-2 ring-offset-4 ring-offset-zinc-900 ${RING[flags[1]]}`
    : "";
  const outlineClass = flags.length > 2
    ? `outline outline-2 outline-offset-4 ${OUTLINE[flags[2]]}`
    : "";

  return (
    <div className={`bg-zinc-900 border-2 rounded-lg p-4 ${borderClass} ${ringClass} ${outlineClass}`}>
      {/* Headshot + name (link to MLB profile) */}
      <a
        href={player.mlbUrl}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col items-center mb-3 group"
      >
        <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 mb-2 flex-shrink-0">
          <Image
            src={player.imageUrl}
            alt={player.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
            unoptimized
          />
        </div>
        <p className="text-zinc-100 font-bold text-sm text-center group-hover:text-white leading-tight">
          {player.name}
        </p>
        <p className="text-zinc-500 text-xs mt-0.5">{player.team}</p>
      </a>

      <div className="border-t border-zinc-800 mb-3" />

      {/* HR rows — each expands independently */}
      <ul className="space-y-2">
        {player.homeRuns.map((hr, i) => (
          <HRRow key={i} hr={hr} playerId={player.id} rowIndex={i} />
        ))}
      </ul>

      {hrNumber != null && (
        <>
          <div className="border-t border-zinc-800 mt-3 mb-2" />
          <p className="text-zinc-600 text-xs text-center italic">
            {isPlayoffs ? `postseason HR #${hrNumber}` : `HR #${hrNumber}`}
          </p>
        </>
      )}
    </div>
  );
}
