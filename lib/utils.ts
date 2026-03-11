export function addSuffix(num: number): string {
  if (num % 10 === 1 && num !== 11) return `${num}st`;
  if (num % 10 === 2 && num !== 12) return `${num}nd`;
  if (num % 10 === 3 && num !== 13) return `${num}rd`;
  return `${num}th`;
}

export function formatDisplayDate(dateStr: string): string {
  // dateStr: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getTodayChicago(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

export function playerImageUrl(playerId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

export function mlbPlayerUrl(playerId: number): string {
  return `https://www.mlb.com/player/${playerId}`;
}
