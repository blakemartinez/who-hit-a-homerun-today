"use client";

import { useState, useEffect, useCallback } from "react";
import HRLoadingAnim from "./HRLoadingAnim";

type Phase = "intro" | "karaoke" | "homerun" | "punchline";

// The quote, word by word, with how long each word stays lit (ms) before advancing
const WORDS: { text: string; hold: number }[] = [
  { text: "And",            hold: 220 },
  { text: "there's",        hold: 200 },
  { text: "a",              hold: 140 },
  { text: "drive",          hold: 280 },
  { text: "into",           hold: 180 },
  { text: "deep",           hold: 240 },
  { text: "left",           hold: 190 },
  { text: "field",          hold: 260 },
  { text: "by",             hold: 180 },
  { text: "Castellanos...", hold: 900 },
  { text: "it",             hold: 200 },
  { text: "will",           hold: 240 },
  { text: "be",             hold: 180 },
  { text: "a",              hold: 160 },
  { text: "home",           hold: 320 },
  { text: "run.",           hold: 900 },
];

export default function CastellanosEasterEgg() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [activeWord, setActiveWord] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);

  const dismiss = useCallback(() => {
    setFading(true);
    setTimeout(() => setDismissed(true), 600);
  }, []);

  // intro → karaoke after 1.4s
  useEffect(() => {
    const t = setTimeout(() => setPhase("karaoke"), 1400);
    return () => clearTimeout(t);
  }, []);

  // karaoke: step through each word
  useEffect(() => {
    if (phase !== "karaoke") return;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;

    function step() {
      setActiveWord(i);
      if (i < WORDS.length - 1) {
        t = setTimeout(() => { i++; step(); }, WORDS[i].hold);
      } else {
        // last word done → homerun phase
        t = setTimeout(() => setPhase("homerun"), WORDS[i].hold);
      }
    }

    step();
    return () => clearTimeout(t);
  }, [phase]);

  // homerun → punchline
  useEffect(() => {
    if (phase !== "homerun") return;
    const t = setTimeout(() => setPhase("punchline"), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  // punchline auto-dismiss after 8s (or click)
  useEffect(() => {
    if (phase !== "punchline") return;
    const t = setTimeout(dismiss, 8000);
    return () => clearTimeout(t);
  }, [phase, dismiss]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center font-mono px-8 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
      onClick={phase === "punchline" ? dismiss : undefined}
    >
      {/* ── INTRO ─────────────────────────────────── */}
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-red-500 text-xs tracking-widest uppercase animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Live Broadcast — Cincinnati Reds
          </div>
          <HRLoadingAnim />
        </div>
      )}

      {/* ── KARAOKE ───────────────────────────────── */}
      {phase === "karaoke" && (
        <div className="max-w-2xl text-center">
          <p className="text-xs text-zinc-600 tracking-widest uppercase mb-8">
            Thom Brennaman — Reds play-by-play, August 19, 2020
          </p>
          <p className="text-4xl font-bold leading-loose">
            {WORDS.map(({ text }, i) => (
              <span
                key={i}
                className={`mr-[0.35em] transition-colors duration-100 ${
                  i < activeWord
                    ? "text-zinc-600"
                    : i === activeWord
                    ? "text-white"
                    : "text-zinc-800"
                }`}
              >
                {text}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* ── HOME RUN ──────────────────────────────── */}
      {phase === "homerun" && (
        <div className="flex flex-col items-center gap-8">
          <p className="text-6xl font-black text-white tracking-tight animate-bounce">
            HOME RUN!
          </p>
          <HRLoadingAnim />
        </div>
      )}

      {/* ── PUNCHLINE ─────────────────────────────── */}
      {phase === "punchline" && (
        <div className="flex flex-col items-center gap-8 max-w-lg text-center">
          <p className="text-5xl font-black text-white tracking-tight">HOME RUN!</p>

          <div className="space-y-3 text-zinc-400 text-base leading-relaxed">
            <p>
              Reds broadcaster Thom Brennaman was in the middle of an on-air apology
              for a homophobic slur caught on a hot mic.
            </p>
            <p className="text-zinc-200 font-semibold">
              Nick Castellanos then hit a home run.
            </p>
            <p>
              Thom had to stop the apology to call it.
            </p>
          </div>

          <p className="text-emerald-500 font-bold text-lg">
            The most Nick Castellanos thing ever.
          </p>

          <p className="text-zinc-700 text-xs tracking-widest uppercase mt-2">
            tap anywhere to continue
          </p>
        </div>
      )}
    </div>
  );
}
