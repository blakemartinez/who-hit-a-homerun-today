"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function SportToggle({
  currentDate,
  sport,
}: {
  currentDate: string;
  sport: "mlb" | "wbc";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function go(s: "mlb" | "wbc") {
    if (s === sport) return;
    const params = new URLSearchParams();
    params.set("date", currentDate);
    if (s === "wbc") params.set("sport", "wbc");
    startTransition(() => router.push(`/?${params.toString()}`));
  }

  return (
    <div className="inline-flex items-center rounded-full border border-zinc-800 overflow-hidden text-xs">
      {(["mlb", "wbc"] as const).map((s) => (
        <button
          key={s}
          onClick={() => go(s)}
          className={`px-3 py-1 uppercase tracking-widest transition-colors ${
            sport === s
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
