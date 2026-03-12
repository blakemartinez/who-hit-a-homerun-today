"use client";

import { useSearchParams } from "next/navigation";
import { formatDisplayDate, getTodayChicago } from "@/lib/utils";

export default function LoadingTitle() {
  const params = useSearchParams();
  const date = params.get("date") ?? getTodayChicago();
  const isToday = date === getTodayChicago();
  const displayDate = formatDisplayDate(date);

  return (
    <h1 className="text-2xl font-bold tracking-tight text-zinc-100 text-center">
      {isToday ? (
        <>
          who hit a homerun{" "}
          <span className="underline underline-offset-4 decoration-zinc-600">today</span>?
        </>
      ) : (
        <>
          who hit a homerun on{" "}
          <span className="underline underline-offset-4 decoration-zinc-600">{displayDate}</span>?
        </>
      )}
    </h1>
  );
}
