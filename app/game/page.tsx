import type { Metadata } from "next";
import { getSchedule, getPlayByPlay, getHRLeadersWithTeam, getPlayerInfo, Play } from "@/lib/mlb";
import { addSuffix, getTodayChicago } from "@/lib/utils";
import DailyChallenge, { HRStats } from "@/components/DailyChallenge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daily HR Challenge",
  description:
    "Guess who hit today's hardest home run. One HR per day, same for everyone — 3 chances with hints.",
};

export const dynamic = "force-dynamic";

const FALLBACK_DATE = "2024-08-15";

const WELL_KNOWN_PLAYERS = [
  "Aaron Judge",
  "Shohei Ohtani",
  "Juan Soto",
  "Ronald Acuña Jr.",
  "Mike Trout",
  "Freddie Freeman",
  "Yordan Alvarez",
  "Bryce Harper",
  "Manny Machado",
  "Fernando Tatis Jr.",
  "Julio Rodríguez",
  "Bo Bichette",
  "Vladimir Guerrero Jr.",
  "Pete Alonso",
  "Kyle Tucker",
  "Trea Turner",
  "Nolan Arenado",
  "Paul Goldschmidt",
  "José Abreu",
  "Corey Seager",
];

const VALID_GAME_TYPES = new Set(["R", "S", "F", "D", "L", "W"]);

interface HREntry {
  playerName: string;
  playerId: number;
  team: string;
  gamePk: number;
  playId: string;
  exitVelo: number | null;
  distance: number | null;
  launchAngle: number | null;
  pitchType: string | null;
  pitchSpeed: number | null;
  inning: string;
  topBottom: "Top" | "Bot";
  runsScored: string;
  venue: string;
  captivatingIndex: number | null;
  coordX: number | null;
  coordY: number | null;
}

async function fetchHRsForDate(date: string): Promise<HREntry[]> {
  const games = await getSchedule(date);
  const entries: HREntry[] = [];

  for (const game of games) {
    if (!VALID_GAME_TYPES.has(game.gameType)) continue;

    const awayTeam = game.teams.away.team.name;
    const homeTeam = game.teams.home.team.name;
    const venue = game.venue?.name ?? "";

    const plays: Play[] = await getPlayByPlay(game.gamePk);

    for (const play of plays) {
      if (play.result?.eventType !== "home_run") continue;

      const { fullName: playerName, id: playerId } = play.matchup.batter;
      const { inning, isTopInning } = play.about;
      const topBottom = isTopInning ? ("Top" as const) : ("Bot" as const);
      const team = topBottom === "Top" ? awayTeam : homeTeam;

      let exitVelo: number | null = null;
      let launchAngle: number | null = null;
      let distance: number | null = null;
      let coordX: number | null = null;
      let coordY: number | null = null;
      let pitchType: string | null = null;
      let pitchSpeed: number | null = null;

      for (const event of play.playEvents) {
        if (event.hitData) {
          exitVelo = event.hitData.launchSpeed ?? null;
          launchAngle = event.hitData.launchAngle ?? null;
          distance = event.hitData.totalDistance ?? null;
          coordX = event.hitData.coordinates?.coordX ?? null;
          coordY = event.hitData.coordinates?.coordY ?? null;
          pitchType = event.details?.type?.description ?? null;
          pitchSpeed = event.pitchData?.startSpeed
            ? Math.round(event.pitchData.startSpeed)
            : null;
          break;
        }
      }

      const rbi = play.result.rbi;
      const runsScored = rbi === 1 ? "Solo" : rbi === 4 ? "Grand Slam" : `${rbi} run`;
      const captivatingIndex = play.about.captivatingIndex ?? null;

      entries.push({
        playerName,
        playerId,
        team,
        gamePk: game.gamePk,
        playId: play.playId,
        exitVelo,
        distance,
        launchAngle,
        pitchType,
        pitchSpeed,
        inning: addSuffix(inning),
        topBottom,
        runsScored,
        venue,
        captivatingIndex,
        coordX,
        coordY,
      });
    }
  }

  return entries;
}

function pickDailyHR(entries: HREntry[]): HREntry {
  return entries.reduce((best, curr) => {
    const bestVelo = best.exitVelo ?? -1;
    const currVelo = curr.exitVelo ?? -1;
    if (currVelo > bestVelo) return curr;
    if (currVelo === bestVelo) {
      const bestDist = best.distance ?? -1;
      const currDist = curr.distance ?? -1;
      return currDist > bestDist ? curr : best;
    }
    return best;
  });
}

function buildPlayerPool(
  dailyHR: HREntry,
  entries: HREntry[],
  leaders: { person: { fullName: string } }[]
): string[] {
  const pool = new Set<string>();
  pool.add(dailyHR.playerName);

  // Add other HR hitters from the same day
  for (const e of entries) {
    if (e.playerName !== dailyHR.playerName) {
      pool.add(e.playerName);
    }
  }

  // Add HR leaders
  for (const l of leaders) {
    pool.add(l.person.fullName);
  }

  // Add well-known players to pad
  for (const name of WELL_KNOWN_PLAYERS) {
    pool.add(name);
  }

  // Shuffle and return (correct answer stays in pool)
  const arr = Array.from(pool);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Ensure correct answer is present (it always is, but keep it in position after shuffle)
  return arr;
}

export default async function GamePage() {
  const today = getTodayChicago();
  const season = Number(today.slice(0, 4));

  let entries = await fetchHRsForDate(today);
  let usedDate = today;

  if (entries.length === 0) {
    entries = await fetchHRsForDate(FALLBACK_DATE);
    usedDate = FALLBACK_DATE;
  }

  if (entries.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
        <div className="max-w-lg mx-auto px-4 py-10">
          <Link
            href="/"
            className="text-xs text-zinc-600 hover:text-zinc-300 tracking-widest uppercase transition-colors mb-8 inline-block"
          >
            ← back
          </Link>
          <p className="text-zinc-500 text-sm">no home runs found to play with.</p>
        </div>
      </main>
    );
  }

  const dailyHR = pickDailyHR(entries);

  // Build player pool from leaders + same-day hitters + well-known
  const [leaders, playerInfo] = await Promise.all([
    getHRLeadersWithTeam(season, 50),
    getPlayerInfo(dailyHR.playerId),
  ]);
  const playerPool = buildPlayerPool(dailyHR, entries, leaders);

  const hrStats: HRStats = {
    exitVelo: dailyHR.exitVelo,
    distance: dailyHR.distance,
    launchAngle: dailyHR.launchAngle,
    pitchType: dailyHR.pitchType,
    pitchSpeed: dailyHR.pitchSpeed,
    inning: dailyHR.inning,
    topBottom: dailyHR.topBottom,
    runsScored: dailyHR.runsScored,
    venue: dailyHR.venue,
    captivatingIndex: dailyHR.captivatingIndex,
    coordX: dailyHR.coordX,
    coordY: dailyHR.coordY,
    playId: dailyHR.playId,
    gamePk: dailyHR.gamePk,
    playerTeam: dailyHR.team,
    batSide: playerInfo?.batSide?.description ?? null,
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link
          href="/"
          className="text-xs text-zinc-600 hover:text-zinc-300 tracking-widest uppercase transition-colors mb-8 inline-block"
        >
          ← back
        </Link>

        <DailyChallenge
          hr={hrStats}
          answer={dailyHR.playerName}
          date={usedDate}
          playerPool={playerPool}
        />
      </div>
    </main>
  );
}
