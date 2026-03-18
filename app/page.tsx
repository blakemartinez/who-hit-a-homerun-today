import type { Metadata } from "next";
import { getSchedule, getPlayByPlay, getHRLeaders, getScheduleWithProbables, getHRLeadersWithTeam, Play } from "@/lib/mlb";
import {
  addSuffix,
  formatDisplayDate,
  getTodayChicago,
  playerImageUrl,
  mlbPlayerUrl,
} from "@/lib/utils";
import DatePicker from "@/components/DatePicker";
import PlayerGrid from "@/components/PlayerGrid";
import InfoModal from "@/components/InfoModal";
import CastellanosEasterEgg from "@/components/CastellanosEasterEgg";
import ShareButton from "@/components/ShareButton";
import EmptyState from "@/components/EmptyState";
import HRThreatsList, { HRThreat } from "@/components/HRThreatsList";
import SportToggle from "@/components/SportToggle";

const CASTELLANOS_DATE = "2020-08-19";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; sport?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const date = params.date ?? getTodayChicago();
  const isWBC = params.sport === "wbc";
  const displayDate = formatDisplayDate(date);
  const isToday = date === getTodayChicago();

  const league = isWBC ? "WBC" : "MLB";
  const title = isToday ? `Who Hit a Homerun Today? (${league})` : `${league} Home Runs on ${displayDate}`;
  const description = isToday
    ? `Live ${league} home run tracker — see every home run hit today with distance, exit velocity, launch angle, and pitch data.`
    : `${league} home runs hit on ${displayDate} — distance, exit velocity, launch angle, and pitch data for every home run.`;
  const sportParam = isWBC ? "&sport=wbc" : "";
  const url = isToday ? `https://homeruntoday.vercel.app${isWBC ? "?sport=wbc" : ""}` : `https://homeruntoday.vercel.app/?date=${date}${sportParam}`;

  return {
    title,
    description,
    openGraph: { title, description, url },
    alternates: { canonical: url },
  };
}

export interface HomeRunEvent {
  topBottom: "Top" | "Bot";
  inning: string;
  runsScored: string;
  exitVelo: number | null;
  launchAngle: number | null;
  distance: number | null;
  hardness: string | null;
  pitchType: string | null;
  pitchSpeed: number | null;
  coordX: number | null;
  coordY: number | null;
  captivatingIndex: number | null;
  hrNumber: number | null;
  isPlayoffs: boolean;
  milestone: string | null;
  venue: string;
}

const ROUND_MILESTONES = new Set([10, 20, 25, 30, 35, 40, 45, 50, 55]);

function getMilestone(
  hrNumber: number | null,
  isPlayoffs: boolean,
): string | null {
  if (hrNumber !== null) {
    // All-time records
    if (hrNumber === 73) return "ties Bonds' all-time record (73)";
    if (hrNumber === 70) return "ties McGwire's mark (70)";
    if (hrNumber === 66) return "ties Sosa's 1998 mark (66)";
    // Beyond Judge's AL record — historic PED-era only territory
    if (hrNumber >= 63 && hrNumber < 66) return `HR #${hrNumber} — beyond Judge's AL record`;
    // Judge's AL record
    if (hrNumber === 62) return "breaks Judge/Maris AL record (62)";
    // Maris
    if (hrNumber === 61) return "ties Maris' record (61)";
    // Ruth
    if (hrNumber === 60) return "ties Ruth's record (60)";
    // Postseason
    if (isPlayoffs && hrNumber === 1) return "postseason debut";
    // Season debut
    if (!isPlayoffs && hrNumber === 1) return "1st HR of the season";
    // Round numbers
    if (ROUND_MILESTONES.has(hrNumber)) return `${hrNumber}th HR of the season`;
  }
  return null;
}

export interface PlayerStat {
  name: string;
  id: number;
  team: string;
  imageUrl: string;
  mlbUrl: string;
  homeRuns: HomeRunEvent[];
}

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; sport?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? getTodayChicago();
  const isWBC = params.sport === "wbc";
  const sportId = isWBC ? 51 : 1;
  const season = Number(date.slice(0, 4));
  const today = getTodayChicago();
  const isFutureDate = !isWBC && date > today;

  const [games, hrLeaders, futureSchedule, futureHRLeaders] = await Promise.all([
    getSchedule(date, sportId),
    isWBC ? Promise.resolve([]) : getHRLeaders(season),
    isFutureDate ? getScheduleWithProbables(date) : Promise.resolve([]),
    isFutureDate ? getHRLeadersWithTeam(today.slice(0, 4) === date.slice(0, 4) ? season : season - 1) : Promise.resolve([]),
  ]);

  // Build HR threats for future dates
  let hrThreats: HRThreat[] = [];
  if (isFutureDate && futureSchedule.length > 0 && futureHRLeaders.length > 0) {
    // Build a map: teamId -> game info
    const teamGameMap = new Map<number, {
      opponentTeam: string;
      isHome: boolean;
      venueName: string;
      probablePitcherName: string | null;
    }>();
    for (const game of futureSchedule) {
      const awayTeamId = game.teams.away.team.id;
      const homeTeamId = game.teams.home.team.id;
      const venueName = game.venue?.name ?? "";
      teamGameMap.set(awayTeamId, {
        opponentTeam: game.teams.home.team.name,
        isHome: false,
        venueName,
        probablePitcherName: game.teams.home.probablePitcher?.fullName ?? null,
      });
      teamGameMap.set(homeTeamId, {
        opponentTeam: game.teams.away.team.name,
        isHome: true,
        venueName,
        probablePitcherName: game.teams.away.probablePitcher?.fullName ?? null,
      });
    }

    for (const leader of futureHRLeaders) {
      const gameInfo = teamGameMap.get(leader.team.id);
      if (!gameInfo) continue;
      hrThreats.push({
        playerName: leader.person.fullName,
        teamName: leader.team.name,
        seasonHRs: Number(leader.value),
        opponentTeam: gameInfo.opponentTeam,
        isHome: gameInfo.isHome,
        venueName: gameInfo.venueName,
        probablePitcherName: gameInfo.probablePitcherName,
      });
    }
    // Sort by seasonHRs descending, take top 12
    hrThreats = hrThreats.sort((a, b) => b.seasonHRs - a.seasonHRs).slice(0, 12);
  }

  const playerMap = new Map<number, PlayerStat>();

  const PLAYOFF_TYPES = new Set(["F", "D", "L", "W"]);
  const VALID_GAME_TYPES = new Set(["R", "S", "F", "D", "L", "W"]);

  for (const game of games) {
    if (!VALID_GAME_TYPES.has(game.gameType)) continue;

    const awayTeam = game.teams.away.team.name;
    const homeTeam = game.teams.home.team.name;
    const venue = game.venue?.name ?? "";
    const isPlayoffs = PLAYOFF_TYPES.has(game.gameType);

    const plays: Play[] = await getPlayByPlay(game.gamePk);

    for (const play of plays) {
      if (play.result?.eventType !== "home_run") continue;

      const { fullName: name, id } = play.matchup.batter;
      const { inning, isTopInning } = play.about;
      const topBottom = isTopInning ? ("Top" as const) : ("Bot" as const);
      const team = topBottom === "Top" ? awayTeam : homeTeam;

      // Extract hit data from playEvents (read directly — no regex needed)
      let exitVelo: number | null = null;
      let launchAngle: number | null = null;
      let distance: number | null = null;
      let hardness: string | null = null;
      let coordX: number | null = null;
      let coordY: number | null = null;
      let pitchType: string | null = null;
      let pitchSpeed: number | null = null;
      for (const event of play.playEvents) {
        if (event.hitData) {
          exitVelo = event.hitData.launchSpeed ?? null;
          launchAngle = event.hitData.launchAngle ?? null;
          distance = event.hitData.totalDistance ?? null;
          hardness = event.hitData.hardness ?? null;
          coordX = event.hitData.coordinates?.coordX ?? null;
          coordY = event.hitData.coordinates?.coordY ?? null;
          pitchType = event.details?.type?.description ?? null;
          pitchSpeed = event.pitchData?.startSpeed ? Math.round(event.pitchData.startSpeed) : null;
          break;
        }
      }
      const captivatingIndex = play.about.captivatingIndex ?? null;

      const hrNumberMatch = play.result.description?.match(/\((\d+)\)/);
      const hrNumber = hrNumberMatch ? Number(hrNumberMatch[1]) : null;

      const rbi = play.result.rbi;
      const runsScored = rbi === 1 ? "Solo" : rbi === 4 ? "Grand Slam" : `${rbi} run`;

      const milestone = isWBC ? null : getMilestone(hrNumber, isPlayoffs);

      const hrEvent: HomeRunEvent = {
        topBottom,
        inning: addSuffix(inning),
        runsScored,
        exitVelo,
        launchAngle,
        distance,
        hardness,
        pitchType,
        pitchSpeed,
        coordX,
        coordY,
        captivatingIndex,
        hrNumber,
        isPlayoffs,
        milestone,
        venue,
      };

      if (playerMap.has(id)) {
        playerMap.get(id)!.homeRuns.push(hrEvent);
      } else {
        playerMap.set(id, {
          name,
          id,
          team,
          imageUrl: playerImageUrl(id),
          mlbUrl: mlbPlayerUrl(id),
          homeRuns: [hrEvent],
        });
      }
    }
  }

  const players = Array.from(playerMap.values());
  const totalHRs = players.reduce((sum, p) => sum + p.homeRuns.length, 0);
  const displayDate = formatDisplayDate(date);
  const isToday = date === today;
  const isSpringTraining = games.some((g) => g.gameType === "S");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      {date === CASTELLANOS_DATE && <CastellanosEasterEgg />}
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {isToday ? (
              <>
                who hit a homerun{" "}
                <span className="underline underline-offset-4 decoration-zinc-600">today</span>?
              </>
            ) : (
              <>
                who hit a homerun on{" "}
                <span className="underline underline-offset-4 decoration-zinc-600">{displayDate}</span>?
              </>
            )}
          </h1>
          {isWBC && (
            <p className="text-amber-500 text-xs mt-2 tracking-widest uppercase">world baseball classic</p>
          )}
          {!isWBC && isSpringTraining && (
            <p className="text-zinc-500 text-xs mt-2 tracking-widest uppercase">spring training</p>
          )}
          {!isWBC && !isSpringTraining && games.some((g) => PLAYOFF_TYPES.has(g.gameType)) && (
            <p className="text-zinc-500 text-xs mt-2 tracking-widest uppercase">postseason</p>
          )}
          <div className="mt-4 flex flex-col items-center gap-3">
            <SportToggle currentDate={date} sport={isWBC ? "wbc" : "mlb"} />
            <DatePicker currentDate={date} sport={isWBC ? "wbc" : "mlb"} />
          </div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <InfoModal />
            <span className="text-zinc-700 text-xs">·</span>
            <ShareButton date={date} isToday={isToday} />
          </div>
        </header>

        {/* Player grid + sort */}
        {players.length === 0 ? (
          isFutureDate && hrThreats.length > 0 ? (
            <HRThreatsList threats={hrThreats} date={date} />
          ) : (
            <EmptyState date={date} isToday={isToday} todayDate={today} />
          )
        ) : (
          <PlayerGrid players={players} totalHRs={totalHRs} />
        )}

        {/* HR Leaders sidebar section */}
        {hrLeaders.length > 0 && (
          <section className="mt-16 border-t border-zinc-800 pt-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
              {season} HR Leaders
            </h2>
            <ol className="space-y-2">
              {hrLeaders.map((leader) => (
                <li
                  key={leader.person.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-500 w-6">{leader.rank}.</span>
                  <span className="flex-1 text-zinc-200">{leader.person.fullName}</span>
                  <span className="text-zinc-500 text-xs">{leader.team.name}</span>
                  <span className="text-zinc-100 font-bold ml-4 w-8 text-right">
                    {leader.value}
                  </span>
                </li>
              ))}
            </ol>
          </section>
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
        <p className="mt-1">
          <a
            href="https://github.com/blakemartinez/who-hit-a-homerun-today"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-500 transition-colors"
          >
            2026 Blake Martinez
          </a>
        </p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: isToday ? "Who Hit a Homerun Today?" : `MLB Home Runs — ${displayDate}`,
            description: `MLB home runs hit on ${displayDate}`,
            url: isToday ? "https://homeruntoday.vercel.app" : `https://homeruntoday.vercel.app/?date=${date}`,
            about: {
              "@type": "SportsEvent",
              name: `MLB Games — ${displayDate}`,
              startDate: date,
              sport: "Baseball",
              organizer: { "@type": "SportsOrganization", name: "Major League Baseball", url: "https://www.mlb.com" },
            },
            ...(players.length > 0 && {
              mainEntity: {
                "@type": "ItemList",
                name: `Home runs hit on ${displayDate}`,
                numberOfItems: totalHRs,
                itemListElement: players.flatMap((player) =>
                  player.homeRuns.map((hr, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    item: {
                      "@type": "Event",
                      name: `${player.name} home run`,
                      description: `${player.name} (${player.team}) hit a ${hr.runsScored} home run in the ${hr.topBottom} of the ${hr.inning} at ${hr.venue}${hr.distance ? `, ${hr.distance} ft` : ""}${hr.exitVelo ? `, ${hr.exitVelo} mph exit velocity` : ""}.`,
                      startDate: date,
                      location: { "@type": "Place", name: hr.venue },
                      performer: { "@type": "Person", name: player.name },
                    },
                  }))
                ),
              },
            }),
          }),
        }}
      />
    </main>
  );
}
