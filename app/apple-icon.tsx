import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M 27,27 C 22,4 6,5 4,18" fill="none" stroke="#e4e4e7" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="5.5" r="2.8" fill="#e4e4e7"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          backgroundColor: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/svg+xml;base64,${btoa(svg)}`}
          width={130}
          height={130}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: 180, height: 180 }
  );
}
