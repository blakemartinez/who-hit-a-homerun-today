const MLB_API = "https://statsapi.mlb.com/api/v1";

// --- Types ---

export interface ScheduleGame {
  gamePk: number;
  gameType: string; // "R" = regular season, "F/D/L/W" = playoffs
  teams: {
    away: { team: { id: number; name: string } };
    home: { team: { id: number; name: string } };
  };
  venue: { name: string };
}

interface HitData {
  launchSpeed?: number;
  launchAngle?: number;
  totalDistance?: number;
  hardness?: string;
  coordinates?: { coordX: number; coordY: number };
}

export interface PlayEvent {
  hitData?: HitData;
  details?: { type?: { code?: string; description?: string } };
  pitchData?: { startSpeed?: number; coordinates?: { pX?: number; pZ?: number } };
}

export interface Play {
  result: {
    eventType: string;
    rbi: number;
    description: string;
  };
  matchup: {
    batter: { fullName: string; id: number };
  };
  about: {
    inning: number;
    isTopInning: boolean;
    captivatingIndex: number;
  };
  playEvents: PlayEvent[];
}

export interface HRLeader {
  rank: number;
  value: string;
  person: { fullName: string; id: number };
  team: { name: string };
}

// --- Fetch helpers ---

export async function getSchedule(date: string): Promise<ScheduleGame[]> {
  const res = await fetch(
    `${MLB_API}/schedule?sportId=1&date=${date}&hydrate=team,venue`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.dates?.[0]?.games ?? [];
}

export async function getPlayByPlay(gamePk: number): Promise<Play[]> {
  const res = await fetch(
    `${MLB_API}/game/${gamePk}/playByPlay`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.allPlays ?? [];
}

export interface PlayerInfo {
  id: number;
  fullName: string;
  primaryPosition: { abbreviation: string };
  batSide: { description: string };
  currentTeam: { name: string };
  birthDate?: string;
  mlbDebutDate?: string;  // "YYYY-MM-DD"
  height?: string;
  weight?: number;
}

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
}

export interface HRGameLogEntry {
  date: string;         // "YYYY-MM-DD"
  opponent: string;
  isHome: boolean;
  homeRuns: number;
  rbi: number;
  gamePk: number;
}

export async function getPlayerInfo(playerId: number): Promise<PlayerInfo | null> {
  const res = await fetch(
    `${MLB_API}/people/${playerId}?hydrate=currentTeam`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.people?.[0] ?? null;
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
      return { ...split.stat, season: String(s) };
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
  return data.leagueLeaders?.[0]?.leaders ?? [];
}

export async function getHRLeadersWithTeam(season: number, limit = 50): Promise<HRLeader[]> {
  const res = await fetch(
    `${MLB_API}/stats/leaders?leaderCategories=homeRuns&season=${season}&limit=${limit}&sportId=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.leagueLeaders?.[0]?.leaders ?? [];
}
