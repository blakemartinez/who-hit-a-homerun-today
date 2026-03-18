"use client";

import { formatDisplayDate } from "@/lib/utils";

export interface HRThreat {
  playerName: string;
  teamName: string;
  seasonHRs: number;
  opponentTeam: string;
  isHome: boolean;
  venueName: string;
  probablePitcherName: string | null;
}

export default function HRThreatsList({
  threats,
  date,
}: {
  threats: HRThreat[];
  date: string;
}) {
  if (threats.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="mb-5 text-center">
        <h2 className="text-base font-bold tracking-tight text-zinc-100">
          tomorrow&apos;s HR threats
        </h2>
        <p className="text-zinc-600 text-xs mt-1">
          {formatDisplayDate(date)} · based on season HR totals · not a guarantee
        </p>
      </div>

      <div className="space-y-2">
        {threats.map((threat, i) => (
          <div
            key={`${threat.playerName}-${i}`}
            className="flex items-center gap-3 px-4 py-3 rounded bg-zinc-900 border border-zinc-800"
          >
            {/* Rank */}
            <span className="text-zinc-600 text-xs w-5 shrink-0 text-right">{i + 1}.</span>

            {/* Player name + team */}
            <div className="flex-1 min-w-0">
              <span className="text-zinc-100 text-sm font-medium">{threat.playerName}</span>
              <span className="text-zinc-500 text-xs ml-2">{threat.teamName}</span>
            </div>

            {/* Season HRs */}
            <div className="flex flex-col items-center shrink-0">
              <span className="text-zinc-100 font-bold text-sm">{threat.seasonHRs}</span>
              <span className="text-zinc-600 text-[10px] uppercase tracking-wide">HR</span>
            </div>

            {/* Matchup */}
            <div className="hidden sm:flex flex-col items-end shrink-0 min-w-0">
              <span className="text-zinc-400 text-xs">
                {threat.isHome ? "vs" : "@"} {threat.opponentTeam}
              </span>
              <span className="text-zinc-600 text-[10px] truncate max-w-[120px]">{threat.venueName}</span>
            </div>

            {/* Probable pitcher */}
            <div className="hidden md:flex flex-col items-end shrink-0">
              <span className="text-zinc-600 text-[10px] uppercase tracking-wide">vs SP</span>
              <span className="text-zinc-500 text-xs">
                {threat.probablePitcherName ?? "TBD"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-zinc-700 text-xs text-center mt-4">
        matchup info · probable pitchers subject to change
      </p>
    </div>
  );
}
