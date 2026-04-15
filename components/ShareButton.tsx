"use client";

import { useState } from "react";

const BASE_URL = "https://homeruntoday.blakemartinez.dev";

export default function ShareButton({ date, isToday }: { date: string; isToday: boolean }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = isToday ? BASE_URL : `${BASE_URL}/?date=${date}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 tracking-widest uppercase transition-colors duration-150"
      aria-label="Copy link to this page"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7 1H2C1.45 1 1 1.45 1 2V8H2V2H7V1ZM9 3H4C3.45 3 3 3.45 3 4V10C3 10.55 3.45 11 4 11H9C9.55 11 10 10.55 10 10V4C10 3.45 9.55 3 9 3ZM9 10H4V4H9V10Z" fill="currentColor" />
          </svg>
          share
        </>
      )}
    </button>
  );
}
