import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Who Hit a Homerun Today — MLB home run tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Trajectory arc SVG */}
        <svg
          width="420"
          height="220"
          viewBox="0 0 420 220"
          style={{ position: "absolute", top: 60, opacity: 0.18 }}
        >
          <path
            d="M 390,200 C 300,20 60,30 30,140"
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="110" cy="28" r="16" fill="#e4e4e7" />
        </svg>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#f4f4f5",
              letterSpacing: "-1px",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            who hit a homerun
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#f4f4f5",
              letterSpacing: "-1px",
              textAlign: "center",
              lineHeight: 1.1,
              textDecoration: "underline",
              textDecorationColor: "#52525b",
              textUnderlineOffset: "6px",
            }}
          >
            today?
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#71717a",
              marginTop: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            live mlb home run tracker
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 22,
            color: "#3f3f46",
            letterSpacing: "0.05em",
          }}
        >
          homeruntoday.blakemartinez.dev
        </div>
      </div>
    ),
    size
  );
}
