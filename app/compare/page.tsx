import type { Metadata } from "next";
import Link from "next/link";
import {
  getPlayerInfo,
  getSeasonStats,
  getHRGameLog,
  getPlayerHRDetails,
} from "@/lib/mlb";
import ComparePlayerSearch from "@/components/ComparePlayerSearch";
import CompareView from "@/components/CompareView";

export const metadata: Metadata = {
  title: "Compare Players",
  description:
    "Compare two MLB players side-by-side — home run stats, season numbers, and HR details.",
};

export const dynamic = "force-dynamic";

async function fetchPlayerData(playerId: number) {
  const currentYear = new Date().getFullYear();
  const [info, stats] = await Promise.all([
    getPlayerInfo(playerId),
    getSeasonStats(playerId),
  ]);

  if (!info) return null;

  // If stats are from a previous season (not current year), treat as no stats
  const statsForCurrentSeason =
    stats && Number(stats.season) === currentYear ? stats : null;

  // Only fetch HR game log for the current season
  const hrLog = await getHRGameLog(playerId, currentYear);

  const hrDetails =
    hrLog.length > 0 ? await getPlayerHRDetails(playerId, hrLog) : [];

  return { info, stats: statsForCurrentSeason, hrLog, hrDetails };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string }>;
}) {
  const params = await searchParams;
  const p1Id = params.p1 ? Number(params.p1) : null;
  const p2Id = params.p2 ? Number(params.p2) : null;

  const hasP1 = p1Id != null && !isNaN(p1Id);
  const hasP2 = p2Id != null && !isNaN(p2Id);
  const hasBoth = hasP1 && hasP2;

  let player1 = null;
  let player2 = null;

  // Fetch both if both selected, or just one for the name preview
  if (hasBoth) {
    [player1, player2] = await Promise.all([
      fetchPlayerData(p1Id!),
      fetchPlayerData(p2Id!),
    ]);
  } else if (hasP1) {
    player1 = await fetchPlayerData(p1Id!);
  } else if (hasP2) {
    player2 = await fetchPlayerData(p2Id!);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link
          href="/"
          className="text-xs text-zinc-600 hover:text-zinc-300 tracking-widest uppercase transition-colors mb-8 inline-block"
        >
          &larr; back
        </Link>

        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            compare players
          </h1>
          <p className="text-zinc-500 text-sm">
            pick two players to see their HR stats side-by-side
          </p>
        </header>

        {/* Search inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <ComparePlayerSearch slot="p1" label="Player 1" selectedName={player1?.info.fullName} />
          <ComparePlayerSearch slot="p2" label="Player 2" selectedName={player2?.info.fullName} />
        </div>

        {/* Results */}
        {hasBoth && player1 && player2 ? (
          <CompareView player1={player1} player2={player2} />
        ) : hasBoth && (!player1 || !player2) ? (
          <p className="text-zinc-500 text-sm text-center">
            one or both players could not be found.
          </p>
        ) : (
          <p className="text-zinc-600 text-sm text-center">
            search and select two players above to compare.
          </p>
        )}
      </div>

      <footer className="text-center text-zinc-700 text-xs py-8">
        <p>
          data via{" "}
          <a
            href="https://statsapi.mlb.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-500 transition-colors"
          >
            MLB Stats API
          </a>
        </p>
      </footer>
    </main>
  );
}
