import { ImageResponse } from "next/og";
import { getPlayByPlay } from "@/lib/mlb";
import { formatDisplayDate } from "@/lib/utils";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

interface Params {
  date: string;
  gamePk: string;
  playId: string;
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { date, gamePk, playId } = await params;

  const plays = await getPlayByPlay(Number(gamePk));
  const play = plays.find((p) => p.about.atBatIndex === Number(playId));

  if (!play) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#09090b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a1a1aa",
          fontSize: 32,
          fontFamily: "monospace",
        }}
      >
        Home Run Not Found
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const hitEvent = play.playEvents.find((e) => e.hitData);
  const distance = hitEvent?.hitData?.totalDistance ?? null;
  const exitVelo = hitEvent?.hitData?.launchSpeed ?? null;
  const playerName = play.matchup.batter.fullName;
  const pitcherName = play.matchup.pitcher.fullName;
  const displayDate = formatDisplayDate(date);

  // Simple trajectory arc: quadratic bezier as SVG path string
  // W=900, H=300; home plate at bottom right, arc up toward top left
  const arcPath = "M 820,280 Q 450,40 120,240";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#09090b",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 80px",
        fontFamily: "monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background trajectory arc SVG */}
      <svg
        width="900"
        height="300"
        style={{ position: "absolute", bottom: 40, right: 0, opacity: 0.35 }}
      >
        <path
          d={arcPath}
          fill="none"
          stroke="#3f3f46"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Player name */}
      <div
        style={{
          color: "#ffffff",
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: 12,
        }}
      >
        {playerName}
      </div>

      {/* Date */}
      <div
        style={{
          color: "#71717a",
          fontSize: 28,
          marginBottom: 40,
        }}
      >
        {displayDate}
      </div>

      {/* Distance as huge number */}
      {distance != null && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: 120,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {distance}
          </span>
          <span
            style={{
              color: "#71717a",
              fontSize: 40,
              fontWeight: 400,
            }}
          >
            ft
          </span>
        </div>
      )}

      {/* Exit velo */}
      {exitVelo != null && (
        <div
          style={{
            color: "#d4d4d8",
            fontSize: 32,
            marginBottom: 20,
          }}
        >
          {exitVelo} mph exit velocity
        </div>
      )}

      {/* Pitcher — the trash-talk element */}
      <div
        style={{
          color: "#71717a",
          fontSize: 24,
          marginTop: 8,
        }}
      >
        off {pitcherName}
      </div>

      {/* Site watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 80,
          color: "#52525b",
          fontSize: 20,
        }}
      >
        homeruntoday.vercel.app
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
