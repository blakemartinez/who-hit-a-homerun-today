import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayByPlay } from "@/lib/mlb";
import { addSuffix, formatDisplayDate, mlbPlayerUrl } from "@/lib/utils";
import HRTrajectory from "@/components/HRTrajectory";

interface Params {
  date: string;
  gamePk: string;
  playId: string;
}

async function getHRPlay(gamePk: number, playId: string) {
  const plays = await getPlayByPlay(gamePk);
  return plays.find((p) => p.playId === playId) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { date, gamePk, playId } = await params;
  const play = await getHRPlay(Number(gamePk), playId);
  if (!play) return {};

  const hitEvent = play.playEvents.find((e) => e.hitData);
  const distance = hitEvent?.hitData?.totalDistance;
  const playerName = play.matchup.batter.fullName;
  const pitcherName = play.matchup.pitcher.fullName;
  const displayDate = formatDisplayDate(date);

  const title = `${playerName}${distance ? ` — ${distance}ft HR` : " — HR"} off ${pitcherName} · ${displayDate}`;

  return {
    title,
    description: `${playerName} hit a home run off ${pitcherName} on ${displayDate}.`,
    openGraph: {
      title,
      description: `${playerName} hit a home run off ${pitcherName} on ${displayDate}.`,
    },
  };
}

export default async function HRPermalinkPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { date, gamePk, playId } = await params;
  const play = await getHRPlay(Number(gamePk), playId);

  if (!play) notFound();

  const { inning, isTopInning, captivatingIndex } = play.about;
  const topBottom = isTopInning ? "Top" : "Bot";
  const rbi = play.result.rbi;
  const runsScored = rbi === 1 ? "Solo" : rbi === 4 ? "Grand Slam" : `${rbi} run`;

  const hitEvent = play.playEvents.find((e) => e.hitData);
  const exitVelo = hitEvent?.hitData?.launchSpeed ?? null;
  const launchAngle = hitEvent?.hitData?.launchAngle ?? null;
  const distance = hitEvent?.hitData?.totalDistance ?? null;
  const coordX = hitEvent?.hitData?.coordinates?.coordX ?? null;
  const coordY = hitEvent?.hitData?.coordinates?.coordY ?? null;

  const pitchEvent =
    play.playEvents.findLast?.((e) => e.details?.type?.description) ??
    [...play.playEvents].reverse().find((e) => e.details?.type?.description);
  const pitchType = pitchEvent?.details?.type?.description ?? null;
  const pitchSpeed = pitchEvent?.pitchData?.startSpeed
    ? Math.round(pitchEvent.pitchData.startSpeed)
    : null;

  const playerName = play.matchup.batter.fullName;
  const playerId = play.matchup.batter.id;
  const pitcherName = play.matchup.pitcher.fullName;
  const displayDate = formatDisplayDate(date);

  // We don't have venue from play-by-play alone; use a placeholder
  const venue = "";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <div className="max-w-xl mx-auto px-4 py-10">
        <Link
          href={`/?date=${date}`}
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs mb-8 inline-block"
        >
          ← back to {displayDate}
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-4">
          {/* Player name */}
          <a
            href={mlbPlayerUrl(playerId)}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-100 font-bold text-xl hover:text-white transition-colors"
          >
            {playerName}
          </a>

          {/* Date */}
          <p className="text-zinc-500 text-xs mt-1">{displayDate}</p>

          {/* Pitcher */}
          <p className="text-zinc-500 text-sm mt-3">
            off <span className="text-zinc-300">{pitcherName}</span>
          </p>

          <div className="border-t border-zinc-800 my-4" />

          {/* Core stats */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div>
              <p className="text-zinc-600 text-xs">inning</p>
              <p className="text-zinc-200">
                {topBottom} {addSuffix(inning)}
              </p>
            </div>
            <div>
              <p className="text-zinc-600 text-xs">runs scored</p>
              <p className="text-zinc-200">{runsScored}</p>
            </div>
            {distance != null && (
              <div>
                <p className="text-zinc-600 text-xs">distance</p>
                <p className="text-zinc-200">{distance} ft</p>
              </div>
            )}
            {exitVelo != null && (
              <div>
                <p className="text-zinc-600 text-xs">exit velocity</p>
                <p className="text-zinc-200">{exitVelo} mph</p>
              </div>
            )}
            {launchAngle != null && (
              <div>
                <p className="text-zinc-600 text-xs">launch angle</p>
                <p className="text-zinc-200">{launchAngle}°</p>
              </div>
            )}
            {pitchType && (
              <div>
                <p className="text-zinc-600 text-xs">pitch type</p>
                <p className="text-zinc-200">{pitchType}</p>
              </div>
            )}
            {pitchSpeed != null && (
              <div>
                <p className="text-zinc-600 text-xs">pitch speed</p>
                <p className="text-zinc-200">{pitchSpeed} mph</p>
              </div>
            )}
            {captivatingIndex != null && (
              <div>
                <p className="text-zinc-600 text-xs">excitement index</p>
                <p className="text-zinc-200">{captivatingIndex}</p>
              </div>
            )}
          </div>

          {/* Trajectory */}
          {launchAngle != null && distance != null && (
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <HRTrajectory
                launchAngle={launchAngle}
                distance={distance}
                exitVelo={exitVelo}
                venue={venue}
                index={playerId}
                coordX={coordX}
                coordY={coordY}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
