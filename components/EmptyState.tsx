"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import HRLoadingAnim from "@/components/HRLoadingAnim";
import { formatDisplayDate } from "@/lib/utils";

// Random date somewhere in a past MLB regular season (April–September, 2010–2024)
function randomMLBDate(): string {
  const year = 2010 + Math.floor(Math.random() * 15);
  const month = 4 + Math.floor(Math.random() * 6);
  const day = 1 + Math.floor(Math.random() * 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function EmptyState({
  date,
  isToday,
  todayDate,
}: {
  date: string;
  isToday: boolean;
  todayDate: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const isFuture = date > todayDate;
  const isPast = date < todayDate;

  function navigate(d: string) {
    setPendingDate(d);
    startTransition(() => router.push(`/?date=${d}`));
  }

  return (
    <>
      {isPending && pendingDate && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center gap-6 font-mono">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 text-center">
            who hit a homerun on{" "}
            <span className="underline underline-offset-4 decoration-zinc-600">
              {formatDisplayDate(pendingDate)}
            </span>?
          </h1>
          <HRLoadingAnim />
        </div>
      )}

      <div className="flex flex-col items-center gap-6 mt-8 text-center">
        <p className="text-zinc-500 text-lg">
          {isToday ? "no one\u2026yet" : isFuture ? "no games yet." : "no home runs that day."}
        </p>

        <p className="text-zinc-600 text-sm max-w-xs leading-relaxed">
          {isToday
            ? "games might not have started yet, or it's an off day. check back later or look up a player."
            : isPast
            ? "off day, or nobody went deep. try a different date or look up a player's history."
            : "that date hasn't happened yet."}
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => navigate(randomMLBDate())}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded px-3 py-1.5 transition-colors"
          >
            ↻ random date
          </button>

          <button
            onClick={() => window.dispatchEvent(new Event("openPlayerSearch"))}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 rounded px-3 py-1.5 transition-colors"
          >
            ⌕ search a player
          </button>
        </div>
      </div>
    </>
  );
}
