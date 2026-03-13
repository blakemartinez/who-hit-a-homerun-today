"use client";

import { useRouter } from "next/navigation";

export default function SeasonPicker({
  playerId,
  season,
  minYear = 2000,
}: {
  playerId: number;
  season: number;
  minYear?: number;
}) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  function go(year: number) {
    if (year < minYear || year > currentYear) return;
    const params = year === currentYear ? "" : `?season=${year}`;
    router.push(`/player/${playerId}${params}`);
  }

  const years: number[] = [];
  for (let y = currentYear; y >= minYear; y--) years.push(y);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(season - 1)}
        disabled={season <= minYear}
        className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-default transition-colors text-sm leading-none"
        aria-label="Previous season"
      >
        ←
      </button>

      {/* Year select styled as plain text */}
      <div className="relative">
        <select
          value={season}
          onChange={(e) => go(Number(e.target.value))}
          className="appearance-none bg-transparent text-zinc-400 text-xs tabular-nums text-center cursor-pointer hover:text-zinc-200 transition-colors pr-3 outline-none"
          aria-label="Select season"
        >
          {years.map((y) => (
            <option key={y} value={y} className="bg-zinc-900 text-zinc-300">
              {y}
            </option>
          ))}
        </select>
        {/* tiny dropdown caret */}
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-zinc-700 text-xs">
          ▾
        </span>
      </div>

      <button
        onClick={() => go(season + 1)}
        disabled={season >= currentYear}
        className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 disabled:cursor-default transition-colors text-sm leading-none"
        aria-label="Next season"
      >
        →
      </button>
    </div>
  );
}
