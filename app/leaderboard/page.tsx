import type { Metadata } from "next";
import { getHRLeadersWithTeam, getSchedule, getPlayByPlay, Play } from "@/lib/mlb";
import { getTodayChicago, formatDisplayDate, addSuffix } from "@/lib/utils";
import LeaderboardTabs from "@/components/LeaderboardTabs";

export const metadata: Metadata = {
  title: "HR Leaderboard — Who Hit a Homerun Today?",
  description: "MLB home run leaderboard — season leaders and daily stat leaders.",
};

export const dynamic = "force-dynamic";

interface DailyHREntry {
  playerName: string;
  playerId: number;
  team: string;
  distance: number | null;
  exitVelo: number | null;
  inning: string;
  topBottom: "Top" | "Bot";
  venue: string;
  opponent: string;
}

async function getDailyHRs(date: string): Promise<DailyHREntry[]> {
  const games = await getSchedule(date);
  const VALID_GAME_TYPES = new Set(["R", "S", "F", "D", "L", "W"]);
  const entries: DailyHREntry[] = [];

  for (const game of games) {
    if (!VALID_GAME_TYPES.has(game.gameType)) continue;

    const awayTeam = game.teams.away.team.name;
    const homeTeam = game.teams.home.team.name;
    const venue = game.venue?.name ?? "";

    const plays: Play[] = await getPlayByPlay(game.gamePk);

    for (const play of plays) {
      if (play.result?.eventType !== "home_run") continue;

      const { fullName: name, id } = play.matchup.batter;
      const { inning, isTopInning } = play.about;
      const topBottom = isTopInning ? ("Top" as const) : ("Bot" as const);
      const team = topBottom === "Top" ? awayTeam : homeTeam;
      const opponent = topBottom === "Top" ? homeTeam : awayTeam;

      let exitVelo: number | null = null;
      let distance: number | null = null;
      for (const event of play.playEvents) {
        if (event.hitData) {
          exitVelo = event.hitData.launchSpeed ?? null;
          distance = event.hitData.totalDistance ?? null;
          break;
        }
      }

      entries.push({
        playerName: name,
        playerId: id,
        team,
        distance,
        exitVelo,
        inning: addSuffix(inning),
        topBottom,
        venue,
        opponent,
      });
    }
  }

  return entries;
}

export interface SeasonLeader {
  rank: number;
  playerName: string;
  playerId: number;
  team: string;
  homeRuns: string;
}

export interface DailyLongest {
  playerName: string;
  team: string;
  distance: number;
  venue: string;
  inning: string;
}

export interface DailyFastest {
  playerName: string;
  team: string;
  exitVelo: number;
  venue: string;
  inning: string;
}

export interface DailyMultiHR {
  playerName: string;
  team: string;
  count: number;
  opponent: string;
}

export interface LeaderboardData {
  seasonLeaders: SeasonLeader[];
  dailyLongest: DailyLongest[];
  dailyFastest: DailyFastest[];
  dailyMultiHR: DailyMultiHR[];
  date: string;
  displayDate: string;
  season: number;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? getTodayChicago();
  const season = Number(date.slice(0, 4));
  const tab = params.tab ?? "season";

  // Fetch season leaders (top 20)
  const hrLeaders = await getHRLeadersWithTeam(season, 20);
  const seasonLeaders: SeasonLeader[] = hrLeaders.map((leader) => ({
    rank: leader.rank,
    playerName: leader.person.fullName,
    playerId: leader.person.id,
    team: leader.team.name,
    homeRuns: leader.value,
  }));

  // Fetch daily data
  const dailyHRs = await getDailyHRs(date);

  // Longest HR (by distance)
  const withDistance = dailyHRs
    .filter((hr) => hr.distance !== null)
    .sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0))
    .slice(0, 5);
  const dailyLongest: DailyLongest[] = withDistance.map((hr) => ({
    playerName: hr.playerName,
    team: hr.team,
    distance: hr.distance!,
    venue: hr.venue,
    inning: hr.inning,
  }));

  // Fastest HR (by exit velo)
  const withVelo = dailyHRs
    .filter((hr) => hr.exitVelo !== null)
    .sort((a, b) => (b.exitVelo ?? 0) - (a.exitVelo ?? 0))
    .slice(0, 5);
  const dailyFastest: DailyFastest[] = withVelo.map((hr) => ({
    playerName: hr.playerName,
    team: hr.team,
    exitVelo: hr.exitVelo!,
    venue: hr.venue,
    inning: hr.inning,
  }));

  // Most HRs in a game (group by player)
  const playerHRCounts = new Map<string, { playerName: string; team: string; count: number; opponent: string }>();
  for (const hr of dailyHRs) {
    const key = `${hr.playerId}-${hr.opponent}`;
    const existing = playerHRCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      playerHRCounts.set(key, {
        playerName: hr.playerName,
        team: hr.team,
        count: 1,
        opponent: hr.opponent,
      });
    }
  }
  const dailyMultiHR: DailyMultiHR[] = Array.from(playerHRCounts.values())
    .filter((p) => p.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const displayDate = formatDisplayDate(date);

  const data: LeaderboardData = {
    seasonLeaders,
    dailyLongest,
    dailyFastest,
    dailyMultiHR,
    date,
    displayDate,
    season,
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8 text-center">
          <a
            href="/"
            className="text-zinc-600 text-xs uppercase tracking-widest hover:text-zinc-400 transition-colors"
          >
            &larr; back to home runs
          </a>
          <h1 className="text-2xl font-bold tracking-tight mt-3">
            HR Leaderboard
          </h1>
        </header>

        <LeaderboardTabs data={data} activeTab={tab} />
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
