import { ImageResponse } from "next/og";
import { getPlayerInfo, getSeasonStats } from "@/lib/mlb";

export const runtime = "edge";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playerId = parseInt(id, 10);

  const [info, stats] = await Promise.all([
    getPlayerInfo(playerId),
    getSeasonStats(playerId),
  ]);

  const name = info?.fullName ?? "Unknown Player";
  const team = stats?.teamName ?? info?.currentTeam?.name ?? "";
  const season = stats?.season ?? String(new Date().getFullYear());

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#09090b",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 100px",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(63,63,70,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(63,63,70,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Site label */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "60px",
            color: "#3f3f46",
            fontSize: "14px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          homeruntoday
        </div>

        {/* Player name */}
        <div
          style={{
            color: "#f4f4f5",
            fontSize: "72px",
            fontWeight: "bold",
            lineHeight: 1.1,
            marginBottom: "16px",
            display: "flex",
            zIndex: 1,
          }}
        >
          {name}
        </div>

        {/* Team */}
        {team && (
          <div
            style={{
              color: "#a1a1aa",
              fontSize: "28px",
              marginBottom: "48px",
              display: "flex",
              zIndex: 1,
            }}
          >
            {team} · {season}
          </div>
        )}

        {/* Stats row */}
        {stats && (
          <div
            style={{
              display: "flex",
              gap: "60px",
              alignItems: "flex-end",
              zIndex: 1,
            }}
          >
            {/* HR — big feature stat */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  color: "#f87171",
                  fontSize: "96px",
                  fontWeight: "bold",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {stats.homeRuns}
              </div>
              <div
                style={{
                  color: "#52525b",
                  fontSize: "16px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                HR
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "80px",
                background: "#27272a",
                display: "flex",
              }}
            />

            {/* AVG */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  color: "#f4f4f5",
                  fontSize: "48px",
                  fontWeight: "bold",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {stats.avg}
              </div>
              <div
                style={{
                  color: "#52525b",
                  fontSize: "16px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                AVG
              </div>
            </div>

            {/* OPS */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  color: "#f4f4f5",
                  fontSize: "48px",
                  fontWeight: "bold",
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {stats.ops}
              </div>
              <div
                style={{
                  color: "#52525b",
                  fontSize: "16px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  display: "flex",
                }}
              >
                OPS
              </div>
            </div>
          </div>
        )}

        {/* No stats fallback */}
        {!stats && (
          <div
            style={{
              color: "#52525b",
              fontSize: "24px",
              display: "flex",
              zIndex: 1,
            }}
          >
            HR Profile
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  );
}
