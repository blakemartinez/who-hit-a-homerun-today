import { z } from "zod";

const MLB_API = "https://statsapi.mlb.com/api/v1";

// --- Zod Schemas ---

const ScheduleGameSchema = z.object({
  gamePk: z.number(),
  gameType: z.string(),
  teams: z.object({
    away: z.object({ team: z.object({ id: z.number(), name: z.string() }) }),
    home: z.object({ team: z.object({ id: z.number(), name: z.string() }) }),
  }),
  venue: z.object({ name: z.string() }).optional(),
});

const HitDataSchema = z.object({
  launchSpeed: z.number().optional(),
  launchAngle: z.number().optional(),
  totalDistance: z.number().optional(),
  hardness: z.string().optional(),
  coordinates: z.object({ coordX: z.number(), coordY: z.number() }).optional(),
});

const PlayEventSchema = z.object({
  hitData: HitDataSchema.optional(),
  details: z
    .object({
      type: z
        .object({
          code: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  pitchData: z
    .object({
      startSpeed: z.number().optional(),
      coordinates: z
        .object({ pX: z.number().optional(), pZ: z.number().optional() })
        .optional(),
    })
    .optional(),
});

const PlaySchema = z.object({
  result: z.object({
    eventType: z.string(),
    rbi: z.number(),
    description: z.string(),
  }),
  matchup: z.object({
    batter: z.object({ fullName: z.string(), id: z.number() }),
    pitcher: z.object({ fullName: z.string(), id: z.number() }),
  }),
  about: z.object({
    atBatIndex: z.number(),
    inning: z.number(),
    isTopInning: z.boolean(),
    captivatingIndex: z.number().optional(),
  }),
  playEvents: z.array(PlayEventSchema),
});

const HRLeaderSchema = z.object({
  rank: z.number(),
  value: z.string(),
  person: z.object({ fullName: z.string(), id: z.number() }),
  team: z.object({ id: z.number(), name: z.string() }),
});

const ScheduleGameWithProbablesSchema = z.object({
  gamePk: z.number(),
  gameType: z.string(),
  teams: z.object({
    away: z.object({
      team: z.object({ id: z.number(), name: z.string() }),
      probablePitcher: z.object({ fullName: z.string() }).optional(),
    }),
    home: z.object({
      team: z.object({ id: z.number(), name: z.string() }),
      probablePitcher: z.object({ fullName: z.string() }).optional(),
    }),
  }),
  venue: z.object({ name: z.string() }).optional(),
});

const PlayerInfoSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  primaryPosition: z.object({ abbreviation: z.string() }),
  batSide: z.object({ description: z.string() }),
  currentTeam: z.object({ name: z.string() }),
  birthDate: z.string().optional(),
  mlbDebutDate: z.string().optional(),
  height: z.string().optional(),
  weight: z.number().optional(),
});

// --- Types (derived from schemas — exported names stay identical) ---

export type ScheduleGame = z.infer<typeof ScheduleGameSchema>;
export type PlayEvent = z.infer<typeof PlayEventSchema>;
export type Play = z.infer<typeof PlaySchema>;
export type HRLeader = z.infer<typeof HRLeaderSchema>;
export type ScheduleGameWithProbables = z.infer<typeof ScheduleGameWithProbablesSchema>;
export type PlayerInfo = z.infer<typeof PlayerInfoSchema>;

// These are not derived from API schemas — kept as interfaces
export interface SeasonStats {
  gamesPlayed: number;
  atBats: number;
  avg: string;
  homeRuns: number;
  rbi: number;
  obp: string;
  slg: string;
  ops: string;
  season: string;
  teamName?: string;
}

export interface HRGameLogEntry {
  date: string;         // "YYYY-MM-DD"
  opponent: string;
  isHome: boolean;
  homeRuns: number;
  rbi: number;
  gamePk: number;
}

export interface PlayerHRDetail {
  date: string;
  opponent: string;
  isHome: boolean;
  gamePk: number;
  inning: number;
  isTopInning: boolean;
  rbi: number;
  captivatingIndex: number | null;
  coordX: number | null;
  coordY: number | null;
  distance: number | null;
  exitVelo: number | null;
  launchAngle: number | null;
  pitchType: string | null;
  pitchSpeed: number | null;
  pitchX: number | null;
  pitchZ: number | null;
}

// --- Fetch helpers ---

export async function getSchedule(date: string, sportId = 1): Promise<ScheduleGame[]> {
  const res = await fetch(
    `${MLB_API}/schedule?sportId=${sportId}&date=${date}&hydrate=team,venue`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const schema = z.object({
    dates: z.array(z.object({ games: z.array(ScheduleGameSchema) })).optional(),
  });
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("MLB API parse error [getSchedule]:", result.error);
    return [];
  }
  return result.data.dates?.[0]?.games ?? [];
}

export async function getPlayByPlay(gamePk: number): Promise<Play[]> {
  const res = await fetch(
    `${MLB_API}/game/${gamePk}/playByPlay`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const schema = z.object({ allPlays: z.array(PlaySchema).optional() });
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("MLB API parse error [getPlayByPlay]:", result.error);
    return [];
  }
  return result.data.allPlays ?? [];
}

export async function getPlayerInfo(playerId: number): Promise<PlayerInfo | null> {
  const res = await fetch(
    `${MLB_API}/people/${playerId}?hydrate=currentTeam`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const schema = z.object({ people: z.array(PlayerInfoSchema).optional() });
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("MLB API parse error [getPlayerInfo]:", result.error);
    return null;
  }
  return result.data.people?.[0] ?? null;
}

export async function getSeasonStats(playerId: number, season?: number): Promise<SeasonStats | null> {
  const currentYear = new Date().getFullYear();
  // If a specific season is requested, only try that year; otherwise auto-detect
  const seasons = season ? [season] : [currentYear, currentYear - 1];
  for (const s of seasons) {
    const res = await fetch(
      `${MLB_API}/people/${playerId}/stats?stats=statsSingleSeason&group=hitting&season=${s}&sportId=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    const split = data.stats?.[0]?.splits?.[0];
    if (split?.stat?.gamesPlayed > 0) {
      return { ...split.stat, season: String(s), teamName: split.team?.name };
    }
  }
  return null;
}

export async function getHRGameLog(playerId: number, season?: number): Promise<HRGameLogEntry[]> {
  const currentYear = new Date().getFullYear();
  const seasons = season ? [season] : [currentYear, currentYear - 1];
  for (const season of seasons) {
    const res = await fetch(
      `${MLB_API}/people/${playerId}/stats?stats=gameLog&group=hitting&season=${season}&sportId=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    type RawSplit = Record<string, unknown>;
    const splits: HRGameLogEntry[] = (data.stats?.[0]?.splits ?? [])
      .filter((s: RawSplit) => ((s.stat as RawSplit)?.homeRuns as number) > 0)
      .map((s: RawSplit) => ({
        date: s.date as string,
        opponent: (s.opponent as Record<string, unknown>)?.name ?? "Unknown",
        isHome: !s.isHome, // API uses isHome: false = away, invert
        homeRuns: (s.stat as Record<string, unknown>)?.homeRuns as number,
        rbi: (s.stat as Record<string, unknown>)?.rbi as number,
        gamePk: (s.game as Record<string, unknown>)?.gamePk as number,
      }))
      .reverse(); // most recent first
    if (splits.length > 0) return splits;
  }
  return [];
}

export async function getPlayerHRDetails(
  playerId: number,
  games: HRGameLogEntry[]
): Promise<PlayerHRDetail[]> {
  const results = await Promise.all(
    games.map(async (game) => {
      const plays = await getPlayByPlay(game.gamePk);
      return plays
        .filter(
          (p) =>
            p.result.eventType === "home_run" &&
            p.matchup.batter.id === playerId
        )
        .map((p) => {
          const hitEvent = p.playEvents.find((e) => e.hitData);
          // Last pitch event = the pitch that was hit
          const pitchEvent = p.playEvents.findLast?.((e) => e.details?.type?.description)
            ?? [...p.playEvents].reverse().find((e) => e.details?.type?.description);
          return {
            date: game.date,
            opponent: game.opponent,
            isHome: game.isHome,
            gamePk: game.gamePk,
            inning: p.about.inning,
            isTopInning: p.about.isTopInning,
            rbi: p.result.rbi,
            captivatingIndex: p.about.captivatingIndex ?? null,
            coordX: hitEvent?.hitData?.coordinates?.coordX ?? null,
            coordY: hitEvent?.hitData?.coordinates?.coordY ?? null,
            distance: hitEvent?.hitData?.totalDistance ?? null,
            exitVelo: hitEvent?.hitData?.launchSpeed ?? null,
            launchAngle: hitEvent?.hitData?.launchAngle ?? null,
            pitchType: pitchEvent?.details?.type?.description ?? null,
            pitchSpeed: pitchEvent?.pitchData?.startSpeed
              ? Math.round(pitchEvent.pitchData.startSpeed)
              : null,
            pitchX: pitchEvent?.pitchData?.coordinates?.pX ?? null,
            pitchZ: pitchEvent?.pitchData?.coordinates?.pZ ?? null,
          };
        });
    })
  );
  return results.flat();
}

export async function getHRLeaders(season: number): Promise<HRLeader[]> {
  const res = await fetch(
    `${MLB_API}/stats/leaders?leaderCategories=homeRuns&season=${season}&limit=5&sportId=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const schema = z.object({
    leagueLeaders: z.array(z.object({ leaders: z.array(HRLeaderSchema) })).optional(),
  });
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("MLB API parse error [getHRLeaders]:", result.error);
    return [];
  }
  return result.data.leagueLeaders?.[0]?.leaders ?? [];
}

export async function getScheduleWithProbables(date: string): Promise<ScheduleGameWithProbables[]> {
  const res = await fetch(
    `${MLB_API}/schedule?sportId=1&date=${date}&hydrate=team,venue,probablePitcher`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const schema = z.object({
    dates: z
      .array(z.object({ games: z.array(ScheduleGameWithProbablesSchema) }))
      .optional(),
  });
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("MLB API parse error [getScheduleWithProbables]:", result.error);
    return [];
  }
  return result.data.dates?.[0]?.games ?? [];
}

export async function getHRLeadersWithTeam(season: number, limit = 50): Promise<HRLeader[]> {
  const res = await fetch(
    `${MLB_API}/stats/leaders?leaderCategories=homeRuns&season=${season}&limit=${limit}&sportId=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const schema = z.object({
    leagueLeaders: z.array(z.object({ leaders: z.array(HRLeaderSchema) })).optional(),
  });
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("MLB API parse error [getHRLeadersWithTeam]:", result.error);
    return [];
  }
  return result.data.leagueLeaders?.[0]?.leaders ?? [];
}
