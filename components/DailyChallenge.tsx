"use client";

import { useState, useEffect, useRef } from "react";
import HRTrajectory from "@/components/HRTrajectory";
import { formatDisplayDate } from "@/lib/utils";

export interface HRStats {
  exitVelo: number | null;
  distance: number | null;
  launchAngle: number | null;
  pitchType: string | null;
  pitchSpeed: number | null;
  inning: string;
  topBottom: "Top" | "Bot";
  runsScored: string;
  venue: string;
  captivatingIndex: number | null;
  coordX: number | null;
  coordY: number | null;
  // For post-solve reveal
  playId: string;
  gamePk: number;
  playerTeam: string;
  batSide: string | null;
}

interface Props {
  hr: HRStats;
  answer: string;
  date: string;
  playerPool: string[];
}

interface SavedState {
  guesses: string[];
  solved: boolean;
  revealed: { team: boolean; batsSide: boolean };
}

const MAX_GUESSES = 3;
const STORAGE_PREFIX = "daily-hr-challenge-";

function loadState(date: string): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${date}`);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function saveState(date: string, state: SavedState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${date}`, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function buildEmojiGrid(guesses: string[], answer: string): string {
  return guesses.map((g) => (g === answer ? "🟩" : "⬜")).join("");
}

function buildShareText(guesses: string[], answer: string, date: string): string {
  const grid = buildEmojiGrid(guesses, answer);
  const solved = guesses.includes(answer);
  const solveGuess = guesses.indexOf(answer) + 1;
  const resultLine = solved
    ? `Got it in ${solveGuess}!`
    : "Better luck tomorrow.";
  return `daily HR challenge · ${date}\n${grid} ${resultLine}\nhomeruntoday.vercel.app/game`;
}

export default function DailyChallenge({ hr, answer, date, playerPool }: Props) {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState<{ team: boolean; batsSide: boolean }>({
    team: false,
    batsSide: false,
  });
  const [hydrated, setHydrated] = useState(false);

  // Input / dropdown state
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const saved = loadState(date);
    if (saved) {
      setGuesses(saved.guesses);
      setSolved(saved.solved);
      setRevealed(saved.revealed);
    }
    setHydrated(true);
  }, [date]);

  const isGameOver = solved || guesses.length >= MAX_GUESSES;

  const filteredPool = inputValue.trim().length === 0
    ? []
    : playerPool.filter((name) =>
        name.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 8);

  function handleSelect(name: string) {
    if (isGameOver) return;
    setInputValue("");
    setShowDropdown(false);

    const newGuesses = [...guesses, name];
    const newSolved = name === answer;

    // Determine newly unlocked hints
    const newRevealed = { ...revealed };
    if (newGuesses.length >= 1 && !newSolved) {
      newRevealed.team = true;
    }
    if (newGuesses.length >= 2 && !newSolved) {
      newRevealed.batsSide = true;
    }

    const newState: SavedState = {
      guesses: newGuesses,
      solved: newSolved,
      revealed: newRevealed,
    };
    setGuesses(newGuesses);
    setSolved(newSolved);
    setRevealed(newRevealed);
    saveState(date, newState);
  }

  async function handleShare() {
    const text = buildShareText(guesses, answer, date);
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg("copied!");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {
      // user cancelled or API unavailable
    }
  }

  const displayDate = formatDisplayDate(date);
  const hasTrajectory = hr.distance != null && hr.launchAngle != null;

  // Don't render game UI until hydrated to avoid localStorage mismatch flicker
  if (!hydrated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center text-zinc-600 text-sm">
        loading...
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-xl font-bold tracking-tight mb-1">daily HR challenge</h1>
        <p className="text-zinc-600 text-xs tracking-widest uppercase">{displayDate}</p>
      </header>

      {/* HR Stats card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-5">
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">who hit this home run?</p>

        {/* Trajectory */}
        {hasTrajectory && (
          <div className="mb-4">
            <HRTrajectory
              launchAngle={hr.launchAngle!}
              distance={hr.distance!}
              exitVelo={hr.exitVelo}
              venue={hr.venue}
              index={0}
              coordX={hr.coordX}
              coordY={hr.coordY}
            />
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {hr.exitVelo != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">exit velo</span>
              <span className="text-zinc-200 tabular-nums">{hr.exitVelo} mph</span>
            </div>
          )}
          {hr.distance != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">distance</span>
              <span className="text-zinc-200 tabular-nums">{hr.distance} ft</span>
            </div>
          )}
          {hr.launchAngle != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">launch angle</span>
              <span className="text-zinc-200 tabular-nums">{hr.launchAngle}°</span>
            </div>
          )}
          {hr.pitchType != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">pitch type</span>
              <span className="text-zinc-200">{hr.pitchType}</span>
            </div>
          )}
          {hr.pitchSpeed != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">pitch speed</span>
              <span className="text-zinc-200 tabular-nums">{hr.pitchSpeed} mph</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-600">inning</span>
            <span className="text-zinc-200">{hr.topBottom} {hr.inning}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">result</span>
            <span className="text-zinc-200">{hr.runsScored}</span>
          </div>
          {hr.venue && (
            <div className="flex justify-between col-span-2">
              <span className="text-zinc-600">venue</span>
              <span className="text-zinc-200">{hr.venue}</span>
            </div>
          )}
        </div>

        {/* Hints */}
        {(revealed.team || revealed.batsSide) && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">hints</p>
            {revealed.team && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">team</span>
                <span className="text-amber-400">{hr.playerTeam}</span>
              </div>
            )}
            {revealed.batsSide && hr.batSide != null && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">bats</span>
                <span className="text-amber-400">{hr.batSide}</span>
              </div>
            )}
          </div>
        )}

        {/* Post-solve reveal */}
        {isGameOver && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">player</span>
              <span className={solved ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {answer}
              </span>
            </div>
            {hr.playId && hr.gamePk && (
              <div className="mt-2 text-xs">
                <a
                  href={`/hr/${date}/${hr.gamePk}/${hr.playId}`}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
                >
                  view full HR →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guess history */}
      {guesses.length > 0 && (
        <div className="mb-5 space-y-2">
          {guesses.map((g, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-base">{g === answer ? "✅" : "❌"}</span>
              <span className={g === answer ? "text-emerald-400" : "text-red-400"}>{g}</span>
            </div>
          ))}
        </div>
      )}

      {/* Input / autocomplete */}
      {!isGameOver && (
        <div className="relative mb-5">
          <p className="text-zinc-600 text-xs mb-2">
            guess {guesses.length + 1} of {MAX_GUESSES}
          </p>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="type a player name..."
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm px-3 py-2 rounded focus:outline-none focus:border-zinc-400 placeholder-zinc-600"
          />
          {showDropdown && filteredPool.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded overflow-hidden">
              {filteredPool.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    onMouseDown={() => handleSelect(name)}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Result / share */}
      {isGameOver && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p className="text-center text-sm mb-3">
            {solved
              ? <span className="text-emerald-400 font-bold">correct!</span>
              : <span className="text-zinc-400">better luck tomorrow.</span>
            }
          </p>
          <p className="text-center text-2xl mb-4 tracking-wider">
            {buildEmojiGrid(guesses, answer)}
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleShare}
              className="px-5 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-400 hover:text-zinc-100 text-sm tracking-widest transition-colors rounded"
            >
              {shareMsg ?? "share result"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
