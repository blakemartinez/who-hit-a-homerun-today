import type { MetadataRoute } from "next";

// Player pages exist at /player/[id] (MLB Stats API player ID).
// We can't enumerate all players, but seed crawlers with well-known profiles.
const SEED_PLAYERS = [
  { id: 592450, name: "Aaron Judge" },
  { id: 660271, name: "Shohei Ohtani" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://homeruntoday.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...SEED_PLAYERS.map(({ id }) => ({
      url: `https://homeruntoday.vercel.app/player/${id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
