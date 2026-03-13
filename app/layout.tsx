import type { Metadata } from "next";
import "./globals.css";
import PlayerSearch from "@/components/PlayerSearch";

export const metadata: Metadata = {
  metadataBase: new URL("https://homeruntoday.vercel.app"),
  title: {
    default: "Who Hit a Homerun Today?",
    template: "%s | Who Hit a Homerun Today?",
  },
  description:
    "Live MLB home run tracker. See every home run hit today — distance, exit velocity, pitch type, launch angle, and more.",
  keywords: ["MLB home runs", "baseball", "home run tracker", "who hit a home run today", "MLB stats", "dingers"],
  authors: [{ name: "Blake Martinez" }],
  openGraph: {
    type: "website",
    siteName: "Who Hit a Homerun Today?",
    title: "Who Hit a Homerun Today?",
    description:
      "Live MLB home run tracker. See every home run hit today — distance, exit velocity, pitch type, and more.",
    url: "https://homeruntoday.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Who Hit a Homerun Today?",
    description:
      "Live MLB home run tracker. See every home run hit today — distance, exit velocity, pitch type, and more.",
  },
  alternates: { canonical: "https://homeruntoday.vercel.app" },
  manifest: "/favicon/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body>
        {children}
        <PlayerSearch />
      </body>
    </html>
  );
}
