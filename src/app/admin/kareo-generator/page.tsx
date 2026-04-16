"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const EXPRESSIONS = [
  "default",
  "thinking",
  "celebrating",
  "sad",
  "encouraging",
  "loading",
  "error",
  "waving",
] as const;

type Expression = (typeof EXPRESSIONS)[number];

const EXPRESSION_LABELS: Record<Expression, string> = {
  default: "デフォルト",
  thinking: "考え中",
  celebrating: "お祝い",
  sad: "悲しい",
  encouraging: "応援",
  loading: "ローディング",
  error: "エラー",
  waving: "手を振る",
};

interface GenerationResult {
  success?: boolean;
  error?: string;
  detail?: string;
  filename?: string;
  path?: string;
  size?: number;
  preview?: string;
}

export default function KareoGeneratorPage() {
  const [generating, setGenerating] = useState<Expression | null>(null);
  const [results, setResults] = useState<Record<string, GenerationResult>>({});
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>(
    {}
  );
  const [pngExists, setPngExists] = useState<Record<string, boolean>>({});
  const [bustKey, setBustKey] = useState(0);

  // Check which PNGs already exist
  const checkExistingPngs = useCallback(async () => {
    const checks: Record<string, boolean> = {};
    for (const expr of EXPRESSIONS) {
      try {
        const res = await fetch(`/kareo/kareo-${expr}.png`, {
          method: "HEAD",
        });
        checks[expr] = res.ok;
      } catch {
        checks[expr] = false;
      }
    }
    setPngExists(checks);
  }, []);

  useEffect(() => {
    checkExistingPngs();
  }, [checkExistingPngs]);

  const handleGenerate = async (expression: Expression) => {
    setGenerating(expression);
    setResults((prev) => ({ ...prev, [expression]: {} }));

    try {
      const res = await fetch("/api/admin/generate-kareo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expression,
          prompt: customPrompts[expression] || undefined,
        }),
      });

      const data: GenerationResult = await res.json();
      setResults((prev) => ({ ...prev, [expression]: data }));

      if (data.success) {
        setPngExists((prev) => ({ ...prev, [expression]: true }));
        setBustKey((k) => k + 1);
      }
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [expression]: { error: String(err) },
      }));
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = (expression: string, preview?: string) => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = `kareo-${expression}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          Kareo Character Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Gemini AI でカレオキャラクター画像を生成します。生成した PNG は
          public/kareo/ に保存され、SVG の代わりに表示されます。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPRESSIONS.map((expr) => {
            const result = results[expr];
            const isGenerating = generating === expr;
            const hasPng = pngExists[expr];

            return (
              <div
                key={expr}
                className="bg-white rounded-xl shadow-sm border p-4 flex flex-col items-center gap-3"
              >
                <h3 className="font-semibold text-sm">
                  {EXPRESSION_LABELS[expr]}
                  <span className="text-gray-400 ml-1 font-normal">
                    ({expr})
                  </span>
                </h3>

                {/* Current SVG */}
                <div className="relative">
                  <div className="text-xs text-gray-400 mb-1 text-center">
                    SVG (現在)
                  </div>
                  <Image
                    src={`/kareo/kareo-${expr}.svg`}
                    alt={`${expr} SVG`}
                    width={100}
                    height={120}
                    className="object-contain"
                  />
                </div>

                {/* Generated PNG or placeholder */}
                <div className="relative">
                  <div className="text-xs text-gray-400 mb-1 text-center">
                    PNG (AI生成)
                  </div>
                  {result?.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.preview}
                      alt={`${expr} generated`}
                      className="w-[100px] h-[120px] object-contain"
                    />
                  ) : hasPng ? (
                    <Image
                      key={bustKey}
                      src={`/kareo/kareo-${expr}.png?v=${bustKey}`}
                      alt={`${expr} PNG`}
                      width={100}
                      height={120}
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="w-[100px] h-[120px] bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">
                      未生成
                    </div>
                  )}
                </div>

                {/* Custom prompt */}
                <textarea
                  className="w-full text-xs border rounded p-2 h-16 resize-none"
                  placeholder="追加プロンプト（任意）"
                  value={customPrompts[expr] || ""}
                  onChange={(e) =>
                    setCustomPrompts((prev) => ({
                      ...prev,
                      [expr]: e.target.value,
                    }))
                  }
                />

                {/* Generate button */}
                <button
                  onClick={() => handleGenerate(expr)}
                  disabled={isGenerating || generating !== null}
                  className="w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {isGenerating
                    ? "生成中..."
                    : hasPng
                      ? "再生成"
                      : "AIで生成"}
                </button>

                {/* Download button */}
                {(result?.preview || hasPng) && (
                  <button
                    onClick={() => handleDownload(expr, result?.preview)}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                    disabled={!result?.preview}
                  >
                    ダウンロード
                  </button>
                )}

                {/* Status */}
                {result?.error && (
                  <p className="text-xs text-red-500 w-full break-all">
                    {result.error}
                    {result.detail && (
                      <span className="block text-gray-400 mt-1">
                        {result.detail.slice(0, 200)}
                      </span>
                    )}
                  </p>
                )}
                {result?.success && (
                  <p className="text-xs text-emerald-600">
                    保存完了 ({Math.round((result.size || 0) / 1024)}KB)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
