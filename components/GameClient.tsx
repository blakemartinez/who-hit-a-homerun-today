"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import HRTrajectory from "@/components/HRTrajectory";

export interface GameRound {
  playerName: string;
  distance: number | null;
  exitVelo: number | null;
  launchAngle: number | null;
  pitchType: string | null;
  pitchSpeed: number | null;
  inning: string;
  topBottom: "Top" | "Bot";
  runsScored: string;
  venue: string;
  coordX: number | null;
  coordY: number | null;
  options: string[]; // 4 names, shuffled, one is playerName
}

interface Props {
  rounds: GameRound[];
}

type AnswerState = "unanswered" | "correct" | "wrong";

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildShuffledOptions(rounds: GameRound[]): string[][] {
  return rounds.map((r) => shuffleArray(r.options));
}

export default function GameClient({ rounds }: Props) {
  const [shuffledOptions] = useState<string[][]>(() => buildShuffledOptions(rounds));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const round = rounds[currentIndex];
  const options = shuffledOptions[currentIndex];

  const handleGuess = useCallback(
    (name: string) => {
      if (answerState !== "unanswered") return;
      setChosen(name);
      if (name === round.playerName) {
        setAnswerState("correct");
        setScore((s) => s + 1);
      } else {
        setAnswerState("wrong");
      }
    },
    [answerState, round.playerName]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= rounds.length) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setChosen(null);
      setAnswerState("unanswered");
    }
  }, [currentIndex, rounds.length]);

  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setChosen(null);
    setAnswerState("unanswered");
    setScore(0);
    setDone(false);
  }, []);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <p className="text-zinc-500 text-xs tracking-widest uppercase">game over</p>
        <p className="text-5xl font-bold tabular-nums">
          {score}
          <span className="text-zinc-600 text-3xl">/{rounds.length}</span>
        </p>
        <p className="text-zinc-400 text-sm">
          {score === rounds.length
            ? "perfect score!"
            : score >= Math.ceil(rounds.length * 0.7)
            ? "nice work."
            : score >= Math.ceil(rounds.length * 0.4)
            ? "not bad."
            : "better luck next time."}
        </p>
        <button
          onClick={handlePlayAgain}
          className="mt-4 px-5 py-2 border border-zinc-700 text-zinc-300 hover:border-zinc-400 hover:text-zinc-100 text-sm tracking-widest transition-colors"
        >
          play again
        </button>
      </div>
    );
  }

  const hasTrajectory =
    round.distance != null && round.launchAngle != null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Score bar */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="text-xs text-zinc-600 hover:text-zinc-300 tracking-widest uppercase transition-colors"
        >
          ← back
        </Link>
        <span className="text-zinc-400 text-sm tabular-nums font-bold">
          {score}{" "}
          <span className="text-zinc-600 font-normal">/ {rounds.length}</span>
        </span>
      </div>

      {/* Round counter */}
      <p className="text-zinc-600 text-xs tracking-widest uppercase mb-6">
        round {currentIndex + 1} of {rounds.length}
      </p>

      {/* HR stats card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">who hit this home run?</p>

        {/* Trajectory */}
        {hasTrajectory && (
          <div className="mb-4">
            <HRTrajectory
              launchAngle={round.launchAngle!}
              distance={round.distance!}
              exitVelo={round.exitVelo}
              venue={round.venue}
              index={currentIndex}
              coordX={round.coordX}
              coordY={round.coordY}
            />
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mt-2">
          {round.distance != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">distance</span>
              <span className="text-zinc-200 tabular-nums">{round.distance} ft</span>
            </div>
          )}
          {round.exitVelo != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">exit velo</span>
              <span className="text-zinc-200 tabular-nums">{round.exitVelo} mph</span>
            </div>
          )}
          {round.launchAngle != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">launch angle</span>
              <span className="text-zinc-200 tabular-nums">{round.launchAngle}°</span>
            </div>
          )}
          {round.pitchType != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">pitch type</span>
              <span className="text-zinc-200">{round.pitchType}</span>
            </div>
          )}
          {round.pitchSpeed != null && (
            <div className="flex justify-between">
              <span className="text-zinc-600">pitch speed</span>
              <span className="text-zinc-200 tabular-nums">{round.pitchSpeed} mph</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-600">inning</span>
            <span className="text-zinc-200">
              {round.topBottom} {round.inning}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">result</span>
            <span className="text-zinc-200">{round.runsScored}</span>
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {options.map((name) => {
          let btnClass =
            "px-3 py-3 text-sm border rounded transition-colors text-left leading-tight ";
          if (answerState === "unanswered") {
            btnClass +=
              "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 cursor-pointer";
          } else if (name === round.playerName) {
            btnClass += "border-emerald-600 bg-emerald-950 text-emerald-300 cursor-default";
          } else if (name === chosen) {
            btnClass += "border-red-700 bg-red-950 text-red-300 cursor-default";
          } else {
            btnClass += "border-zinc-800 text-zinc-600 cursor-default";
          }

          return (
            <button
              key={name}
              onClick={() => handleGuess(name)}
              disabled={answerState !== "unanswered"}
              className={btnClass}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Feedback + next */}
      {answerState !== "unanswered" && (
        <div className="flex items-center justify-between">
          <p
            className={`text-sm font-bold ${
              answerState === "correct" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {answerState === "correct"
              ? "correct!"
              : `it was ${round.playerName}`}
          </p>
          <button
            onClick={handleNext}
            className="text-sm text-zinc-400 hover:text-zinc-100 tracking-widest transition-colors"
          >
            {currentIndex + 1 >= rounds.length ? "see results →" : "next →"}
          </button>
        </div>
      )}
    </div>
  );
}
