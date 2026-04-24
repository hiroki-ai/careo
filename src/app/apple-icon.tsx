import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon (180×180)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fcfbf8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20%",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="92" rx="28" ry="3" fill="rgba(0,0,0,0.08)" />
          <path
            d="M25 55 Q20 30 42 22 Q50 18 58 22 Q80 30 75 55 Q80 82 50 85 Q20 82 25 55 Z"
            fill="#00c896"
            stroke="#0D0B21"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <ellipse cx="33" cy="52" rx="3.5" ry="2.5" fill="#ff9b8a" opacity="0.7" />
          <ellipse cx="67" cy="52" rx="3.5" ry="2.5" fill="#ff9b8a" opacity="0.7" />
          <ellipse cx="40" cy="42" rx="2.4" ry="3" fill="#0D0B21" />
          <ellipse cx="60" cy="42" rx="2.4" ry="3" fill="#0D0B21" />
          <path d="M42 54 Q50 62 58 54" stroke="#0D0B21" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path
            d="M50 18 Q55 10 62 14 Q58 20 50 22 Z"
            fill="#00a87e"
            stroke="#0D0B21"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
