import type { Metadata } from "next";
import { getSchedule, getPlayByPlay, Play } from "@/lib/mlb";
import { addSuffix, getTodayChicago } from "@/lib/utils";
import GameClient, { GameRound } from "@/components/GameClient";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guess Who Hit It — HR Game",
  description:
    "Can you guess which MLB player hit this home run? A daily guessing game using real HR data.",
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
];

interface HREntry {
  playerName: string;
  distance: number | null;
  exitVelo: number | null;
  launchAngle: number | null;
  pitchType: string | null;
  pitchSpeed: number | null;
  inning: string;
  topBottom: "Top" | "Bot";
  runsScored: string;
  venue: string;
  coordX: number | null;
  coordY: number | null;
}

const VALID_GAME_TYPES = new Set(["R", "S", "F", "D", "L", "W"]);

async function fetchHRsForDate(date: string): Promise<HREntry[]> {
  const games = await getSchedule(date);
  const entries: HREntry[] = [];

  for (const game of games) {
    if (!VALID_GAME_TYPES.has(game.gameType)) continue;

    const venue = game.venue?.name ?? "";

    const plays: Play[] = await getPlayByPlay(game.gamePk);

    for (const play of plays) {
      if (play.result?.eventType !== "home_run") continue;

      const { fullName: playerName } = play.matchup.batter;
      const { inning, isTopInning } = play.about;
      const topBottom = isTopInning ? ("Top" as const) : ("Bot" as const);

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
      const runsScored =
        rbi === 1 ? "Solo" : rbi === 4 ? "Grand Slam" : `${rbi} run`;

      entries.push({
        playerName,
        distance,
        exitVelo,
        launchAngle,
        pitchType,
        pitchSpeed,
        inning: addSuffix(inning),
        topBottom,
        runsScored,
        venue,
        coordX,
        coordY,
      });
    }
  }

  return entries;
}

function buildRounds(entries: HREntry[]): GameRound[] {
  const allNames = [...new Set(entries.map((e) => e.playerName))];

  return entries.map((entry) => {
    // Distractors: other players who hit HRs that day
    const otherPlayers = allNames.filter((n) => n !== entry.playerName);

    // Supplement from well-known list if needed
    const supplementPool = WELL_KNOWN_PLAYERS.filter(
      (n) => n !== entry.playerName && !otherPlayers.includes(n)
    );

    // Pick up to 3 distractors
    const distractors: string[] = [];

    // First use other HR hitters from that day
    const shuffledOthers = [...otherPlayers].sort(() => Math.random() - 0.5);
    for (const name of shuffledOthers) {
      if (distractors.length >= 3) break;
      distractors.push(name);
    }

    // If still need more, pull from well-known
    const shuffledSupplement = [...supplementPool].sort(
      () => Math.random() - 0.5
    );
    for (const name of shuffledSupplement) {
      if (distractors.length >= 3) break;
      distractors.push(name);
    }

    // The options array (shuffling happens client-side in GameClient)
    const options = [entry.playerName, ...distractors];

    return {
      playerName: entry.playerName,
      distance: entry.distance,
      exitVelo: entry.exitVelo,
      launchAngle: entry.launchAngle,
      pitchType: entry.pitchType,
      pitchSpeed: entry.pitchSpeed,
      inning: entry.inning,
      topBottom: entry.topBottom,
      runsScored: entry.runsScored,
      venue: entry.venue,
      coordX: entry.coordX,
      coordY: entry.coordY,
      options,
    };
  });
}

export default async function GamePage() {
  const today = getTodayChicago();
  let entries = await fetchHRsForDate(today);
  let usedDate = today;

  if (entries.length === 0) {
    entries = await fetchHRsForDate(FALLBACK_DATE);
    usedDate = FALLBACK_DATE;
  }

  const rounds = buildRounds(entries);

  if (rounds.length === 0) {
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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <div className="max-w-lg mx-auto px-4 py-10">
        <header className="mb-10 text-center">
          <h1 className="text-xl font-bold tracking-tight mb-1">
            guess who hit it
          </h1>
          <p className="text-zinc-600 text-xs tracking-widest uppercase mt-2">
            {usedDate === today ? "today's" : usedDate} home runs
          </p>
        </header>

        <GameClient rounds={rounds} />
      </div>
    </main>
  );
}
