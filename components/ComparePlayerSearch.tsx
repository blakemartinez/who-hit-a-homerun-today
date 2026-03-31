"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchResult {
  id: number;
  fullName: string;
  currentTeam?: { name: string };
  primaryPosition?: { abbreviation: string };
}

export default function ComparePlayerSearch({
  slot,
  label,
}: {
  slot: "p1" | "p2";
  label: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Debounced search against MLB people API
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&sportId=1`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setResults((data.people ?? []).slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function select(r: SearchResult) {
    setQuery("");
    setResults([]);
    setFocused(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set(slot, String(r.id));
    router.push(`/compare?${params.toString()}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && results[activeIdx]) select(results[activeIdx]);
    if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = focused && query.length >= 2;

  return (
    <div className="relative">
      <label className="text-zinc-600 text-xs tracking-widest uppercase block mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
        <span className="text-zinc-500 text-sm shrink-0">&#x2315;</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay to allow click on result
            setTimeout(() => setFocused(false), 200);
          }}
          onKeyDown={onKeyDown}
          placeholder="search players..."
          className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-600 outline-none"
        />
        {loading && (
          <span className="text-zinc-600 text-xs tracking-widest">...</span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-20 max-h-64 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    onClick={() => select(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                      i === activeIdx ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className="text-zinc-100 text-sm">{r.fullName}</span>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 shrink-0">
                      {r.primaryPosition?.abbreviation && (
                        <span>{r.primaryPosition.abbreviation}</span>
                      )}
                      {r.currentTeam?.name && (
                        <span className="text-zinc-600 truncate max-w-28">
                          {r.currentTeam.name}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !loading && (
              <p className="px-3 py-4 text-zinc-600 text-sm text-center">
                no players found.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
