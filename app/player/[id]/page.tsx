import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPlayerInfo, getSeasonStats, getHRGameLog, getPlayerHRDetails } from "@/lib/mlb";
import { playerImageUrl } from "@/lib/utils";
import SeasonPicker from "@/components/SeasonPicker";
import HRFlipbook from "@/components/HRFlipbook";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const playerId = Number(id);
  const [info, stats] = await Promise.all([
    getPlayerInfo(playerId),
    getSeasonStats(playerId),
  ]);
  const name = info?.fullName ?? "Player";
  const team = info?.currentTeam?.name;
  const season = stats ? Number(stats.season) : new Date().getFullYear();
  const hr = stats?.homeRuns;

  const title = hr != null && team
    ? `${name} — ${hr} HR · ${team} · ${season} HR Profile`
    : `${name} — HR Profile`;
  const description = hr != null && team
    ? `${name} hit ${hr} home runs in ${season} for the ${team}. View trajectory maps, exit velocity, pitch breakdown, and full game log.`
    : `Home run stats and game log for ${name}.`;

  const url = `https://homeruntoday.vercel.app/player/${playerId}`;

  return {
    title,
    description,
    openGraph: { title, description, url },
    alternates: { canonical: url },
  };
}

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${
        highlight
          ? "ring-2 ring-red-600 ring-offset-4 ring-offset-zinc-900 rounded px-2 py-0.5"
          : ""
      }`}
    >
      <span
        className={`font-bold text-lg tabular-nums ${
          highlight ? "text-red-400" : "text-zinc-100"
        }`}
      >
        {value}
      </span>
      <span className="text-zinc-600 text-xs tracking-widest uppercase">{label}</span>
    </div>
  );
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season: seasonParam } = await searchParams;
  const playerId = Number(id);
  const currentYear = new Date().getFullYear();
  const season = seasonParam ? Number(seasonParam) : undefined;

  const [info, stats, hrLog] = await Promise.all([
    getPlayerInfo(playerId),
    getSeasonStats(playerId, season),
    getHRGameLog(playerId, season),
  ]);

  const hrDetails = hrLog.length > 0 ? await getPlayerHRDetails(playerId, hrLog) : [];

  // Displayed season: from stats, or from explicit param, or current year
  const displaySeason = stats ? Number(stats.season) : (season ?? currentYear);

  // Earliest season from debut date (e.g. "2015-06-08" → 2015), fallback 2000
  const debutYear = info?.mlbDebutDate
    ? Number(info.mlbDebutDate.split("-")[0])
    : 2000;

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
            <p className="text-zinc-500 text-sm mt-0.5">{stats?.teamName ?? info.currentTeam?.name}</p>
            <p className="text-zinc-600 text-xs mt-1">
              {info.primaryPosition?.abbreviation}
              {info.batSide?.description ? ` · bats ${info.batSide.description.toLowerCase()}` : ""}
            </p>
          </div>
        </div>

        {/* Season stats */}
        {(() => {
          const scoredHRs = hrDetails.filter((h) => h.captivatingIndex != null);
          const avgExcitement = scoredHRs.length > 0
            ? Math.round(scoredHRs.reduce((s, h) => s + (h.captivatingIndex ?? 0), 0) / scoredHRs.length)
            : null;
          const peakExcitement = scoredHRs.length > 0
            ? Math.max(...scoredHRs.map((h) => h.captivatingIndex ?? 0))
            : null;
          const clutchCount = scoredHRs.filter((h) => (h.captivatingIndex ?? 0) >= 80).length;
          const avgFilled = avgExcitement != null ? Math.round(avgExcitement / 10) : 0;
          const segColors = [
            "bg-amber-950","bg-amber-900","bg-amber-800","bg-amber-700",
            "bg-amber-600","bg-amber-500","bg-amber-400",
            "bg-yellow-400","bg-yellow-300","bg-yellow-200",
          ];
          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-zinc-600 tracking-widest uppercase">
                  {displaySeason} season
                </p>
                <SeasonPicker playerId={playerId} season={displaySeason} minYear={debutYear} />
              </div>
              {stats ? (
                <div className="flex justify-between gap-2">
                  <StatPill label="G"   value={stats.gamesPlayed} />
                  <StatPill label="AVG" value={stats.avg} />
                  <StatPill label="HR"  value={stats.homeRuns} highlight />
                  <StatPill label="RBI" value={stats.rbi} />
                  <StatPill label="OBP" value={stats.obp} />
                  <StatPill label="OPS" value={stats.ops} />
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center">no stats for {displaySeason}.</p>
              )}

              {/* HR excitement row */}
              {avgExcitement != null && (
                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 text-xs shrink-0">avg excitement</span>
                    <div className="flex gap-px">
                      {segColors.map((c, i) => (
                        <div key={i} className={`w-2 h-1.5 rounded-sm ${i < avgFilled ? c : "bg-zinc-800"}`} />
                      ))}
                    </div>
                    <span className="text-zinc-500 text-xs tabular-nums">{avgExcitement}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-zinc-100 font-bold text-sm tabular-nums">{peakExcitement}</span>
                      <span className="text-zinc-600 text-xs tracking-widest uppercase">peak</span>
                    </div>
                    {clutchCount > 0 && (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-blue-400 font-bold text-sm tabular-nums">{clutchCount}</span>
                        <span className="text-zinc-600 text-xs tracking-widest uppercase">clutch HR{clutchCount !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* HR flipbook (trajectory + spray map + game log) */}
        {hrDetails.length > 0 ? (
          <HRFlipbook hrs={hrDetails} hrLog={hrLog} displaySeason={displaySeason} />
        ) : (
          <p className="text-zinc-600 text-sm">none in {displaySeason}.</p>
        )}

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: info.fullName,
            url: `https://homeruntoday.vercel.app/player/${playerId}`,
            description: info.currentTeam?.name
              ? `MLB player for the ${info.currentTeam.name}`
              : "MLB player",
          }),
        }}
      />
    </main>
  );
}
