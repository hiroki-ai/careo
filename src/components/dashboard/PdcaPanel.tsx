"use client";

interface PdcaResult {
  plan: { weeklyGoal: string; taskCompletion: string };
  do: { highlights: string[]; totalActivity: string };
  check: { score: number; goodPoints: string[]; issues: string[]; insight: string };
  act: { improvements: string[]; nextWeekFocus: string; encouragement: string };
}

interface PdcaPanelProps {
  result: PdcaResult;
}

function ScoreBar({ score }: { score: number }) {
  const gradient =
    score >= 80 ? "from-emerald-400 to-green-500" :
    score >= 60 ? "from-blue-400 to-indigo-500" :
    score >= 40 ? "from-amber-400 to-orange-500" : "from-red-400 to-rose-500";
  const label =
    score >= 80 ? "非常に良い" : score >= 60 ? "良好" : score >= 40 ? "平均的" : "要改善";

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{score}</span>
        <span className="text-xs text-gray-400">/100</span>
        <span className={`text-xs font-medium ml-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{label}</span>
      </div>
    </div>
  );
}

const pdcaCards = [
  {
    key: "plan" as const,
    letter: "P",
    label: "Plan",
    gradient: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-200/60",
    badge: "bg-blue-600 text-white",
    accent: "text-blue-600",
  },
  {
    key: "do" as const,
    letter: "D",
    label: "Do",
    gradient: "from-emerald-500/10 to-green-500/10",
    border: "border-emerald-200/60",
    badge: "bg-emerald-600 text-white",
    accent: "text-emerald-600",
  },
  {
    key: "check" as const,
    letter: "C",
    label: "Check",
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-200/60",
    badge: "bg-amber-500 text-white",
    accent: "text-amber-600",
  },
  {
    key: "act" as const,
    letter: "A",
    label: "Act",
    gradient: "from-purple-500/10 to-violet-500/10",
    border: "border-purple-200/60",
    badge: "bg-purple-600 text-white",
    accent: "text-purple-600",
  },
];

export function PdcaPanel({ result }: PdcaPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-[#0f1c2e] to-[#1a2f4e] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {["P","D","C","A"].map((l, i) => (
                <span key={l} className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                  i === 0 ? "bg-blue-500/30 text-blue-300 border border-blue-500/30" :
                  i === 1 ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30" :
                  i === 2 ? "bg-amber-500/30 text-amber-300 border border-amber-500/30" :
                  "bg-purple-500/30 text-purple-300 border border-purple-500/30"
                }`}>{l}</span>
              ))}
            </div>
            <h2 className="font-semibold text-white text-sm">週次レポート</h2>
          </div>
          <span className="text-xs text-white/40">AIが自動分析</span>
        </div>
        <div className="mt-3">
          <ScoreBar score={result.check.score} />
        </div>
      </div>

      {/* PDCA 4象限 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
        {pdcaCards.map((card) => (
          <div key={card.key} className={`bg-gradient-to-br ${card.gradient} p-4`}>
            <div className="flex items-center gap-1.5 mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${card.badge}`}>{card.label}</span>
            </div>
            {card.key === "plan" && (
              <>
                <p className="text-xs text-gray-700 font-medium mb-1.5 leading-relaxed">{result.plan.weeklyGoal}</p>
                <p className={`text-xs font-bold ${card.accent}`}>{result.plan.taskCompletion}</p>
              </>
            )}
            {card.key === "do" && (
              <>
                <p className="text-xs text-gray-600 mb-1.5 leading-relaxed">{result.do.totalActivity}</p>
                <ul className="space-y-1">
                  {result.do.highlights.slice(0, 2).map((h, i) => (
                    <li key={i} className="text-[11px] text-gray-600 flex gap-1">
                      <span className={`${card.accent} shrink-0`}>›</span>{h}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {card.key === "check" && (
              <>
                <p className="text-xs text-gray-600 mb-1.5 leading-relaxed">{result.check.insight}</p>
                {result.check.issues.slice(0, 1).map((issue, i) => (
                  <p key={i} className="text-[11px] text-amber-700 flex gap-1">
                    <span className="shrink-0">⚠</span>{issue}
                  </p>
                ))}
              </>
            )}
            {card.key === "act" && (
              <>
                <p className={`text-xs font-bold ${card.accent} mb-1.5`}>来週の重点：</p>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">{result.act.nextWeekFocus}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {result.act.improvements.slice(0, 1).map((imp, i) => (
                    <li key={i} className="text-[11px] text-gray-600 flex gap-1">
                      <span className={`${card.accent} shrink-0`}>›</span>{imp}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 良い点 / 改善アクション */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 py-4 border-t border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">✓ うまくいっている点</p>
          <ul className="space-y-1.5">
            {result.check.goodPoints.map((p, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                <span className="text-emerald-500 shrink-0">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">→ 改善アクション</p>
          <ul className="space-y-1.5">
            {result.act.improvements.map((imp, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                <span className="text-purple-400 shrink-0">→</span>{imp}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AIからの一言 */}
      <div className="mx-5 mb-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl px-4 py-3 border border-blue-100/60">
        <p className="text-xs text-gray-600 italic">💬 {result.act.encouragement}</p>
      </div>
    </div>
  );
}
