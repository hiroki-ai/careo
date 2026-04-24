"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ALL_TEMPLATES, CATEGORY_LABELS, recommendedToday, XCategory, XTemplate } from "@/data/xPostTemplates";

/**
 * X 半自動運用ドライバー。
 * Careo開発者（管理者）がここから1クリックで X に投稿できる。
 * AI自動投稿はしない — テンプレから選んで X intent を叩くだけ。
 *
 * 管理者以外はmiddlewareで/adminへのアクセスがブロックされる。
 */
export default function XDraftsPage() {
  const [category, setCategory] = useState<XCategory | "all">("all");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("careo_x_posted");
      if (raw) setPostedIds(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  const markPosted = (id: string) => {
    const next = new Set(postedIds);
    next.add(id);
    setPostedIds(next);
    try { localStorage.setItem("careo_x_posted", JSON.stringify([...next])); } catch { /* ignore */ }
  };

  const clearPosted = () => {
    setPostedIds(new Set());
    try { localStorage.removeItem("careo_x_posted"); } catch { /* ignore */ }
  };

  const recommended = useMemo(() => recommendedToday(), []);

  const filtered = useMemo(() => {
    if (category === "all") return ALL_TEMPLATES;
    return ALL_TEMPLATES.filter((t) => t.category === category);
  }, [category]);

  const fillVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, k) => variables[k] ?? `{{${k}}}`);
  };

  const postToX = (text: string, id: string) => {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
    markPosted(id);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      markPosted(id);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen font-zen-kaku py-8 px-4" style={{ background: "#fcfbf8", color: "#0D0B21" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
          ← Careoトップ
        </Link>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00c896]/12 text-[#00a87e] text-xs font-bold mb-3">
            ADMIN · X 半自動運用ツール
          </div>
          <h1 className="font-klee text-3xl md:text-4xl font-bold mb-2">X 投稿ドライバー</h1>
          <p className="text-sm text-gray-500">
            テンプレを選んで「X で投稿」をタップするだけ。AIは使わず、すべて手動の軽い自動化。
          </p>
        </div>

        {/* 今のおすすめ */}
        {recommended.length > 0 && (
          <section className="mb-8">
            <h2 className="font-klee text-xl font-bold mb-3 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #00c896, #00a87e)" }} />
              いま投稿するなら（時間帯から自動推薦）
            </h2>
            <div className="space-y-3">
              {recommended.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  filled={fillVariables(t.text)}
                  posted={postedIds.has(t.id)}
                  onPost={() => postToX(fillVariables(t.text), t.id)}
                  onCopy={() => copyToClipboard(fillVariables(t.text), t.id)}
                  variables={variables}
                  onVariableChange={(k, v) => setVariables({ ...variables, [k]: v })}
                />
              ))}
            </div>
          </section>
        )}

        {/* カテゴリフィルタ */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-klee text-xl font-bold flex items-center gap-2">
              <span className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #00c896, #00a87e)" }} />
              全テンプレ（{filtered.length}件）
            </h2>
            {postedIds.size > 0 && (
              <button
                type="button"
                onClick={clearPosted}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                投稿済みマーク全リセット
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${category === "all" ? "bg-[#00c896] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              全て ({ALL_TEMPLATES.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as XCategory[]).map((c) => {
              const count = ALL_TEMPLATES.filter((t) => t.category === c).length;
              if (count === 0) return null;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${category === c ? "bg-[#00c896] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {CATEGORY_LABELS[c]} ({count})
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-3">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              filled={fillVariables(t.text)}
              posted={postedIds.has(t.id)}
              onPost={() => postToX(fillVariables(t.text), t.id)}
              onCopy={() => copyToClipboard(fillVariables(t.text), t.id)}
              variables={variables}
              onVariableChange={(k, v) => setVariables({ ...variables, [k]: v })}
            />
          ))}
        </div>

        <div className="mt-10 bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-sm font-bold text-amber-900 mb-2">💡 運用のコツ</p>
          <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
            <li>朝（7-9時）・昼（12時）・夜（21時）が28卒のXアクティブ時間帯</li>
            <li>月水金は tip か story 系、火木は community や data 系がバランス良い</li>
            <li>投稿後に「投稿した」が自動マークされる（ローカル保存）</li>
            <li>テンプレ通りに投稿しない。1単語だけでも自分の言葉に変えるとエンゲージ UP</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  filled,
  posted,
  onPost,
  onCopy,
  variables,
  onVariableChange,
}: {
  template: XTemplate;
  filled: string;
  posted: boolean;
  onPost: () => void;
  onCopy: () => void;
  variables: Record<string, string>;
  onVariableChange: (k: string, v: string) => void;
}) {
  const charCount = filled.length;
  const over = charCount > 280;

  return (
    <div className={`bg-white border rounded-2xl p-4 md:p-5 ${posted ? "opacity-60 border-gray-100" : "border-gray-100"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00c896]/10 text-[#00a87e]">
          {CATEGORY_LABELS[template.category]}
        </span>
        <span className="text-[10px] text-gray-400">#{template.id}</span>
        {posted && <span className="text-[10px] font-bold text-emerald-600">✓ 投稿済み</span>}
        <span className={`ml-auto text-[10px] ${over ? "text-red-500 font-bold" : "text-gray-400"}`}>{charCount}/280</span>
      </div>

      {template.variables && template.variables.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {template.variables.map((v) => (
            <input
              key={v}
              type="text"
              value={variables[v] ?? ""}
              onChange={(e) => onVariableChange(v, e.target.value)}
              placeholder={`{{${v}}}`}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00c896]"
            />
          ))}
        </div>
      )}

      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 bg-gray-50 rounded-xl p-3 mb-3 font-sans">
        {filled}
      </pre>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPost}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-black text-white hover:opacity-80 transition-opacity"
        >
          𝕏 で投稿
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center justify-center text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          コピー
        </button>
      </div>
    </div>
  );
}
