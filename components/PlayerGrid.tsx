"use client";

import { useState, useMemo } from "react";
import type { PlayerStat } from "@/app/page";
import PlayerCard from "@/components/PlayerCard";

type SortKey = "default" | "excitement" | "distance" | "velo";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default",    label: "game order" },
  { key: "excitement", label: "excitement" },
  { key: "distance",   label: "distance"   },
  { key: "velo",       label: "exit velo"  },
];

const LEGEND = [
  { label: "milestone",  dot: "border-emerald-600", check: (p: PlayerStat) => p.homeRuns.some((hr) => hr.milestone !== null) },
  { label: "moonshot",   dot: "border-red-600",     check: (p: PlayerStat) => p.homeRuns.some((hr) => (hr.distance ?? 0) >= 450) },
  { label: "scorcher",   dot: "border-yellow-500",  check: (p: PlayerStat) => p.homeRuns.some((hr) => (hr.exitVelo ?? 0) >= 110) },
  { label: "multi-HR",   dot: "border-purple-600",  check: (p: PlayerStat) => p.homeRuns.length > 1 },
  { label: "clutch",     dot: "border-blue-600",    check: (p: PlayerStat) => p.homeRuns.some((hr) => (hr.captivatingIndex ?? 0) >= 80) },
];

export default function PlayerGrid({ players, totalHRs }: { players: PlayerStat[]; totalHRs: number }) {
  const [sort, setSort] = useState<SortKey>("default");

  const activeLegend = LEGEND.filter(({ check }) => players.some(check));

  const sorted = useMemo(() => {
    if (sort === "excitement") {
      return [...players].sort((a, b) => {
        const aMax = Math.max(...a.homeRuns.map((hr) => hr.captivatingIndex ?? 0));
        const bMax = Math.max(...b.homeRuns.map((hr) => hr.captivatingIndex ?? 0));
        return bMax - aMax;
      });
    }
    if (sort === "distance") {
      return [...players].sort((a, b) => {
        const aMax = Math.max(...a.homeRuns.map((hr) => hr.distance ?? 0));
        const bMax = Math.max(...b.homeRuns.map((hr) => hr.distance ?? 0));
        return bMax - aMax;
      });
    }
    if (sort === "velo") {
      return [...players].sort((a, b) => {
        const aMax = Math.max(...a.homeRuns.map((hr) => hr.exitVelo ?? 0));
        const bMax = Math.max(...b.homeRuns.map((hr) => hr.exitVelo ?? 0));
        return bMax - aMax;
      });
    }
    return players;
  }, [players, sort]);

  return (
    <>
      {/* HR count + sort bar */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <p className="text-zinc-500 text-sm">
          {totalHRs} HR{totalHRs !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1 text-xs text-zinc-600">
          <span>sort:</span>
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-2 py-0.5 transition-colors ${
                sort === key
                  ? "text-zinc-300 underline underline-offset-2 decoration-zinc-500"
                  : "hover:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {activeLegend.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            {activeLegend.map(({ label, dot }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm border ${dot} inline-block`} />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sorted.map((p) => (
          <PlayerCard key={p.id} player={p} date={p.date} gamePk={p.gamePk} />
        ))}
      </div>
    </>
  );
}
