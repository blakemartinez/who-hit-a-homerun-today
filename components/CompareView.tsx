"use client";

import Image from "next/image";
import Link from "next/link";
import { playerImageUrl } from "@/lib/utils";
import type { PlayerInfo, SeasonStats, HRGameLogEntry, PlayerHRDetail } from "@/lib/mlb";

interface PlayerData {
  info: PlayerInfo;
  stats: SeasonStats | null;
  hrLog: HRGameLogEntry[];
  hrDetails: PlayerHRDetail[];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function WinnerCell({
  value,
  otherValue,
  format,
  higherWins = true,
}: {
  value: number | string | null;
  otherValue: number | string | null;
  format?: (v: number | string) => string;
  higherWins?: boolean;
}) {
  const numVal = typeof value === "string" ? parseFloat(value) : value;
  const numOther =
    typeof otherValue === "string" ? parseFloat(otherValue) : otherValue;
  const isWinner =
    numVal != null &&
    numOther != null &&
    (higherWins ? numVal > numOther : numVal < numOther);

  const display = value != null ? (format ? format(value) : String(value)) : "--";

  return (
    <span
      className={`font-bold text-base tabular-nums ${
        isWinner ? "text-emerald-400" : "text-zinc-100"
      }`}
    >
      {display}
    </span>
  );
}

function StatRow({
  label,
  v1,
  v2,
  higherWins = true,
  format,
}: {
  label: string;
  v1: number | string | null;
  v2: number | string | null;
  higherWins?: boolean;
  format?: (v: number | string) => string;
}) {
  return (
    <div className="grid grid-cols-3 items-center py-2 border-b border-zinc-800/50 last:border-b-0">
      <div className="text-right pr-4">
        <WinnerCell
          value={v1}
          otherValue={v2}
          format={format}
          higherWins={higherWins}
        />
      </div>
      <div className="text-center">
        <span className="text-zinc-500 text-xs tracking-widest uppercase">
          {label}
        </span>
      </div>
      <div className="text-left pl-4">
        <WinnerCell
          value={v2}
          otherValue={v1}
          format={format}
          higherWins={higherWins}
        />
      </div>
    </div>
  );
}

function PlayerHeader({ data }: { data: PlayerData }) {
  return (
    <Link
      href={`/player/${data.info.id}`}
      className="flex flex-col items-center group"
    >
      <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 mb-2 shrink-0">
        <Image
          src={playerImageUrl(data.info.id)}
          alt={data.info.fullName}
          width={80}
          height={80}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
      <p className="text-zinc-100 font-bold text-sm text-center group-hover:text-white leading-tight">
        {data.info.fullName}
      </p>
      <p className="text-zinc-500 text-xs mt-0.5">
        {data.info.currentTeam?.name}
      </p>
      <p className="text-zinc-600 text-xs mt-0.5">
        {data.info.primaryPosition?.abbreviation}
      </p>
    </Link>
  );
}

function HRTimeline({
  dates,
  label,
}: {
  dates: string[];
  label: string;
}) {
  if (dates.length === 0) return null;
  return (
    <div className="mt-1">
      <p className="text-zinc-600 text-xs mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {dates.map((d, i) => {
          const parts = d.split("-");
          const short = `${parts[1]}/${parts[2]}`;
          return (
            <span
              key={`${d}-${i}`}
              className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
            >
              {short}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function CompareView({
  player1,
  player2,
}: {
  player1: PlayerData;
  player2: PlayerData;
}) {
  // Computed HR stats
  function hrStats(data: PlayerData) {
    const dists = data.hrDetails
      .map((h) => h.distance)
      .filter((d): d is number => d != null);
    const velos = data.hrDetails
      .map((h) => h.exitVelo)
      .filter((v): v is number => v != null);
    return {
      totalHRs: data.stats?.homeRuns ?? data.hrLog.reduce((s, g) => s + g.homeRuns, 0),
      avgDistance: avg(dists),
      avgExitVelo: avg(velos),
      longestHR: dists.length > 0 ? Math.max(...dists) : null,
      fastestHR: velos.length > 0 ? Math.max(...velos) : null,
      clutchHRs: data.hrDetails.filter(
        (h) => (h.captivatingIndex ?? 0) >= 80
      ).length,
      dates: data.hrDetails.map((h) => h.date),
    };
  }

  const s1 = hrStats(player1);
  const s2 = hrStats(player2);

  const season = player1.stats?.season ?? player2.stats?.season ?? "";

  return (
    <div>
      {/* Player headers */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <PlayerHeader data={player1} />
        <PlayerHeader data={player2} />
      </div>

      {/* Season stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <p className="text-center text-zinc-600 text-xs tracking-widest uppercase mb-3">
          {season} season stats
        </p>
        <StatRow label="G" v1={player1.stats?.gamesPlayed ?? null} v2={player2.stats?.gamesPlayed ?? null} />
        <StatRow label="AVG" v1={player1.stats?.avg ?? null} v2={player2.stats?.avg ?? null} />
        <StatRow
          label="HR"
          v1={player1.stats?.homeRuns ?? null}
          v2={player2.stats?.homeRuns ?? null}
        />
        <StatRow label="RBI" v1={player1.stats?.rbi ?? null} v2={player2.stats?.rbi ?? null} />
        <StatRow label="OBP" v1={player1.stats?.obp ?? null} v2={player2.stats?.obp ?? null} />
        <StatRow label="OPS" v1={player1.stats?.ops ?? null} v2={player2.stats?.ops ?? null} />
      </div>

      {/* HR-specific comparison */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
        <p className="text-center text-zinc-600 text-xs tracking-widest uppercase mb-3">
          HR breakdown
        </p>
        <StatRow label="Total HR" v1={s1.totalHRs} v2={s2.totalHRs} />
        <StatRow
          label="Avg Dist"
          v1={s1.avgDistance || null}
          v2={s2.avgDistance || null}
          format={(v) => `${v} ft`}
        />
        <StatRow
          label="Avg EV"
          v1={s1.avgExitVelo || null}
          v2={s2.avgExitVelo || null}
          format={(v) => `${v} mph`}
        />
        <StatRow
          label="Longest"
          v1={s1.longestHR}
          v2={s2.longestHR}
          format={(v) => `${v} ft`}
        />
        <StatRow
          label="Hardest"
          v1={s1.fastestHR}
          v2={s2.fastestHR}
          format={(v) => `${v} mph`}
        />
        <StatRow label="Clutch" v1={s1.clutchHRs} v2={s2.clutchHRs} />
      </div>

      {/* HR timeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <p className="text-center text-zinc-600 text-xs tracking-widest uppercase mb-3">
          HR timeline
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <HRTimeline dates={s1.dates} label={player1.info.fullName} />
          <HRTimeline dates={s2.dates} label={player2.info.fullName} />
        </div>
        {s1.dates.length === 0 && s2.dates.length === 0 && (
          <p className="text-zinc-600 text-sm text-center">
            no HR details available for this season.
          </p>
        )}
      </div>
    </div>
  );
}
