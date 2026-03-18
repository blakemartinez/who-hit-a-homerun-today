"use client";

import { useState } from "react";

interface Props {
  url: string;
  title: string;
}

export default function HRShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        void handleClick();
      }}
      title={copied ? "copied!" : "share"}
      className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 shrink-0"
      aria-label="Share home run"
    >
      {copied ? (
        <span className="text-[10px] text-zinc-400">copied!</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3 h-3"
        >
          <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.475l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
        </svg>
      )}
    </button>
  );
}
