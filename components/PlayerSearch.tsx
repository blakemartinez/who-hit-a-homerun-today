"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: number;
  fullName: string;
  currentTeam?: { name: string };
  primaryPosition?: { abbreviation: string };
}

export default function PlayerSearch() {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  // Global Cmd+K / Ctrl+K shortcut + custom "openPlayerSearch" event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("openPlayerSearch", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("openPlayerSearch", onOpen);
    };
  }, []);

  // Focus + reset on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setQuery("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced search against MLB people API (covers all-time players)
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(
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
    setOpen(false);
    router.push(`/player/${r.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[activeIdx]) select(results[activeIdx]);
  }

  return (
    <>
      {/* Fixed trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Search players"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 text-xs font-mono px-3 py-2 rounded-full shadow-lg transition-colors"
      >
        <span>⌕</span>
        <span className="hidden sm:inline">search players</span>
        <kbd className="hidden sm:inline text-zinc-700 border border-zinc-700 rounded px-1 py-0.5 text-xs leading-none">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-zinc-950/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <span className="text-zinc-500 text-base leading-none">⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
                onKeyDown={onKeyDown}
                placeholder="search players..."
                className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-600 outline-none"
              />
              {loading
                ? <span className="text-zinc-600 text-xs tracking-widest">...</span>
                : <span className="text-zinc-700 text-xs">esc</span>
              }
            </div>

            {/* Results */}
            {results.length > 0 && (
              <ul className="py-1 max-h-72 overflow-y-auto">
                {results.map((r, i) => (
                  <li key={r.id}>
                    <button
                      onClick={() => select(r)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                        i === activeIdx ? "bg-zinc-800" : "hover:bg-zinc-800/50"
                      }`}
                    >
                      <span className="text-zinc-100 text-sm">{r.fullName}</span>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 shrink-0">
                        {r.primaryPosition?.abbreviation && (
                          <span>{r.primaryPosition.abbreviation}</span>
                        )}
                        {r.currentTeam?.name && (
                          <span className="text-zinc-600 truncate max-w-32">{r.currentTeam.name}</span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <p className="px-4 py-6 text-zinc-600 text-sm text-center">no players found.</p>
            )}

            {query.length < 2 && (
              <p className="px-4 py-4 text-zinc-700 text-xs text-center">type at least 2 characters</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
