import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// 32x32 favicon — シンプルなCareoKun表現（豆型ボディ + 目 + 笑顔）
export default function Icon() {
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
        }}
      >
        <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M25 55 Q20 30 42 22 Q50 18 58 22 Q80 30 75 55 Q80 82 50 85 Q20 82 25 55 Z"
            fill="#00c896"
            stroke="#0D0B21"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse cx="40" cy="48" rx="3.5" ry="4.5" fill="#0D0B21" />
          <ellipse cx="60" cy="48" rx="3.5" ry="4.5" fill="#0D0B21" />
          <path d="M42 60 Q50 66 58 60" stroke="#0D0B21" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path
            d="M50 18 Q55 10 62 14 Q58 20 50 22 Z"
            fill="#00a87e"
            stroke="#0D0B21"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
