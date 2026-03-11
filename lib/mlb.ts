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
  pitchData?: { startSpeed?: number };
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

export async function getHRLeaders(season: number): Promise<HRLeader[]> {
  const res = await fetch(
    `${MLB_API}/stats/leaders?leaderCategories=homeRuns&season=${season}&limit=5&sportId=1`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.leagueLeaders?.[0]?.leaders ?? [];
}
