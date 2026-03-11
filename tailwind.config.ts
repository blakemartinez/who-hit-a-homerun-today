import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    // Hardness tag colors
    "text-red-900", "text-red-600", "text-red-400",
    // Excitement bar gradient
    "bg-amber-950", "bg-amber-900", "bg-amber-800", "bg-amber-700",
    "bg-amber-600", "bg-amber-500", "bg-amber-400",
    "bg-yellow-400", "bg-yellow-300", "bg-yellow-200",
    // Card border + ring colors (dynamically constructed)
    "border-emerald-600", "border-red-600", "border-yellow-500", "border-purple-600", "border-blue-600",
    "ring-2", "ring-offset-4", "ring-offset-zinc-900",
    "ring-emerald-600", "ring-red-700", "ring-yellow-400", "ring-purple-500", "ring-blue-500",
    "outline", "outline-2", "outline-offset-4",
    "outline-emerald-600", "outline-red-600", "outline-yellow-500", "outline-purple-600", "outline-blue-600",
  ],
  plugins: [],
};

export default config;
