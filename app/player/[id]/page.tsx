import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPlayerInfo, getSeasonStats, getHRGameLog } from "@/lib/mlb";
import { playerImageUrl, formatDisplayDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const info = await getPlayerInfo(Number(id));
  const name = info?.fullName ?? "Player";
  return {
    title: `${name} — HR Profile`,
    description: `Home run stats and game log for ${name}.`,
  };
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-zinc-100 font-bold text-lg tabular-nums">{value}</span>
      <span className="text-zinc-600 text-xs tracking-widest uppercase">{label}</span>
    </div>
  );
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playerId = Number(id);

  const [info, stats, hrLog] = await Promise.all([
    getPlayerInfo(playerId),
    getSeasonStats(playerId),
    getHRGameLog(playerId),
  ]);

  if (!info) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex items-center justify-center">
        <p className="text-zinc-500">player not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back */}
        <Link
          href="/"
          className="text-xs text-zinc-600 hover:text-zinc-300 tracking-widest uppercase transition-colors mb-8 inline-block"
        >
          ← back
        </Link>

        {/* Player header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
            <Image
              src={playerImageUrl(playerId)}
              alt={info.fullName}
              width={80}
              height={80}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 leading-tight">{info.fullName}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{info.currentTeam?.name}</p>
            <p className="text-zinc-600 text-xs mt-1">
              {info.primaryPosition?.abbreviation}
              {info.batSide?.description ? ` · bats ${info.batSide.description.toLowerCase()}` : ""}
            </p>
          </div>
        </div>

        {/* Season stats */}
        {stats ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-8">
            <p className="text-xs text-zinc-600 tracking-widest uppercase mb-4">
              {stats.season} season
            </p>
            <div className="flex justify-between gap-2">
              <StatPill label="G"   value={stats.gamesPlayed} />
              <StatPill label="AVG" value={stats.avg} />
              <StatPill label="HR"  value={stats.homeRuns} />
              <StatPill label="RBI" value={stats.rbi} />
              <StatPill label="OBP" value={stats.obp} />
              <StatPill label="OPS" value={stats.ops} />
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-8">
            <p className="text-zinc-600 text-sm text-center">no season stats yet.</p>
          </div>
        )}

        {/* HR game log */}
        <div>
          <h2 className="text-xs text-zinc-600 tracking-widest uppercase mb-4">
            home runs this season
            {hrLog.length > 0 && (
              <span className="text-zinc-500 ml-2">· {hrLog.reduce((s, g) => s + g.homeRuns, 0)} total</span>
            )}
          </h2>

          {hrLog.length === 0 ? (
            <p className="text-zinc-600 text-sm">none yet.</p>
          ) : (
            <ul className="space-y-px">
              {hrLog.map((entry, i) => (
                <li key={i}>
                  <Link
                    href={`/?date=${entry.date}`}
                    className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-zinc-900 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 text-xs w-24 shrink-0">
                        {formatDisplayDate(entry.date).replace(/,\s*\d{4}$/, "")}
                      </span>
                      <span className="text-zinc-400 text-sm">
                        {entry.isHome ? "vs" : "@"}{" "}
                        <span className="text-zinc-300">{entry.opponent}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-zinc-500 text-xs">
                        {entry.homeRuns > 1 && (
                          <span className="text-purple-400 font-bold mr-2">{entry.homeRuns} HR</span>
                        )}
                        {entry.rbi} RBI
                      </span>
                      <span className="text-zinc-700 text-xs group-hover:text-zinc-500 transition-colors">→</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* MLB.com link */}
        <div className="mt-10 pt-6 border-t border-zinc-800">
          <a
            href={`https://www.mlb.com/player/${playerId}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-600 hover:text-zinc-400 tracking-widest uppercase transition-colors"
          >
            view on mlb.com ↗
          </a>
        </div>

      </div>
    </main>
  );
}
