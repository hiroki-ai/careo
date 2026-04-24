"use client";

import { useState } from "react";

interface ShareImageButtonProps {
  imageUrl: string;
  tweetText: string;
  shareUrl?: string;
  label?: string;
  variant?: "primary" | "ghost";
}

export function ShareImageButton({
  imageUrl,
  tweetText,
  shareUrl = "https://careoai.jp",
  label = "シェア",
  variant = "ghost",
}: ShareImageButtonProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const xIntent = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  const baseStyle =
    variant === "primary"
      ? "bg-[#00c896] hover:bg-[#00b088] text-white"
      : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${baseStyle}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
        </svg>
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 z-50 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              onClick={() => setOpen(false)}
            >
              👁 画像をプレビュー
            </a>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="block w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100 disabled:opacity-50"
            >
              {downloading ? "ダウンロード中..." : "💾 画像をダウンロード"}
            </button>
            <a
              href={xIntent}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-xs font-bold text-[#00a87e] hover:bg-[#00c896]/5"
              onClick={() => setOpen(false)}
            >
              𝕏 Xで投稿する →
            </a>
            <p className="px-4 py-2 text-[10px] text-gray-400 bg-gray-50 leading-relaxed">
              Xで投稿後、ダウンロードした画像を添付すると映えます
            </p>
          </div>
        </>
      )}
    </div>
  );
}
