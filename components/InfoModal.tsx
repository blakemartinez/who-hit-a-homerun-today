"use client";

import { useState } from "react";

export default function InfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
      >
        what is this?
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-zinc-950/80 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full text-xs text-zinc-400 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <span className="text-zinc-100 font-bold text-sm">what is this?</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors">✕</button>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <p className="text-zinc-100 font-medium leading-relaxed">
                I just really like baseball and I really like visualizations.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                This started as a quick weekend thing and kind of got out of hand. Pick any date, see who went yard. Each card is a player who homered that day. Expand a row and you get the trajectory view — launch angle, exit velo, distance, where it landed.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Click a player&apos;s name or photo to open their profile: season stats, a spray map of HR landing spots, and a flipper you can page through game by game. Each HR shows the pitch, ball metrics, and MLB&apos;s excitement score. The season picker goes back to their debut year.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                the player profile also has a pitch zone map — every HR plotted in the strike zone, color-coded by pitch type — and a pitch type breakdown showing which pitches they&apos;ve gone deep on.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                ⌘K or the search icon in the corner finds any player — active or retired.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                toggle <span className="text-zinc-300">WBC</span> at the top to switch to World Baseball Classic mode — same tracker, same data, but for WBC games.
              </p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                there&apos;s also a <a href="/game" className="text-zinc-300 hover:text-zinc-100 underline underline-offset-2 transition-colors">game</a> — given the stats and trajectory of a HR, guess which player hit it. today&apos;s HRs, no hints.
              </p>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <p className="text-zinc-300 mb-2">the border colors mean things:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-emerald-600 mt-0.5 shrink-0" />
                  <span><span className="text-zinc-300">milestone</span> — record-tying, 30th or 50th of the season, postseason debut</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-red-600 mt-0.5 shrink-0" />
                  <span><span className="text-zinc-300">moonshot</span> — 450+ feet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-yellow-500 mt-0.5 shrink-0" />
                  <span><span className="text-zinc-300">scorcher</span> — 110+ mph exit velo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-purple-600 mt-0.5 shrink-0" />
                  <span><span className="text-zinc-300">multi-HR game</span> — hit more than one that day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-blue-600 mt-0.5 shrink-0" />
                  <span><span className="text-zinc-300">clutch</span> — MLB&apos;s captivating index 80+, their internal score for how exciting a play was given the game situation</span>
                </li>
              </ul>
              <p className="mt-2">cards can have more than one border if they hit multiple thresholds.</p>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-2">
              <p className="text-zinc-500">
                data via{" "}
                <a
                  href="https://statsapi.mlb.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors"
                >
                  MLB Stats API
                </a>
                {" "}— free, public, and genuinely great.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
