"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import HRLoadingAnim from "@/components/HRLoadingAnim";

export default function DatePicker({ currentDate }: { currentDate: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {/* Full-screen overlay while new date's data loads */}
      {isPending && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center gap-6 font-mono">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            who hit a homerun{" "}
            <span className="underline underline-offset-4 decoration-zinc-600">today</span>?
          </h1>
          <HRLoadingAnim />
        </div>
      )}

      <div className="inline-flex items-center gap-1">
        <button
          onClick={() => {
            const d = new Date(currentDate + "T12:00:00");
            d.setDate(d.getDate() - 1);
            const prev = d.toISOString().slice(0, 10);
            startTransition(() => router.push(`/?date=${prev}`));
          }}
          className="text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
        >
          ‹
        </button>
        <input
          type="date"
          defaultValue={currentDate}
          onChange={(e) => {
            if (e.target.value) {
              startTransition(() => {
                router.push(`/?date=${e.target.value}`);
              });
            }
          }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
        />
        <button
          onClick={() => {
            const d = new Date(currentDate + "T12:00:00");
            d.setDate(d.getDate() + 1);
            const next = d.toISOString().slice(0, 10);
            startTransition(() => router.push(`/?date=${next}`));
          }}
          className="text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
        >
          ›
        </button>
      </div>
    </>
  );
}
