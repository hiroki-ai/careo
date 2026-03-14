"use client";

interface PdcaResult {
  plan: {
    weeklyGoal: string;
    taskCompletion: string;
  };
  do: {
    highlights: string[];
    totalActivity: string;
  };
  check: {
    score: number;
    goodPoints: string[];
    issues: string[];
    insight: string;
  };
  act: {
    improvements: string[];
    nextWeekFocus: string;
    encouragement: string;
  };
}

interface PdcaPanelProps {
  result: PdcaResult;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-600" :
    score >= 60 ? "text-blue-600" :
    score >= 40 ? "text-yellow-600" : "text-red-500";
  const bg =
    score >= 80 ? "bg-green-50 border-green-200" :
    score >= 60 ? "bg-blue-50 border-blue-200" :
    score >= 40 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  return (
    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${bg} shrink-0`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-[9px] text-gray-400 font-medium">/ 100</span>
    </div>
  );
}

function Section({
  letter, label, color, children
}: {
  letter: string; label: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${color} shrink-0`}>{letter}</span>
        <span className="text-xs font-semibold text-gray-600">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function PdcaPanel({ result }: PdcaPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {["P","D","C","A"].map((l, i) => (
              <span key={l} className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded ${
                i === 0 ? "bg-blue-600 text-white" :
                i === 1 ? "bg-green-600 text-white" :
                i === 2 ? "bg-amber-500 text-white" :
                "bg-purple-600 text-white"
              }`}>{l}</span>
            ))}
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">PDCA 週次レポート</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">進捗スコア</span>
          <span className={`text-sm font-bold ${
            result.check.score >= 80 ? "text-green-600" :
            result.check.score >= 60 ? "text-blue-600" :
            result.check.score >= 40 ? "text-yellow-600" : "text-red-500"
          }`}>{result.check.score}/100</span>
        </div>
      </div>

      {/* スコアバー */}
      <div className="mb-4">
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              result.check.score >= 80 ? "bg-green-500" :
              result.check.score >= 60 ? "bg-blue-500" :
              result.check.score >= 40 ? "bg-yellow-500" : "bg-red-400"
            }`}
            style={{ width: `${result.check.score}%` }}
          />
        </div>
      </div>

      {/* PDCA 4象限 */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* P */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">Plan</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">{result.plan.weeklyGoal}</p>
          <p className="text-[11px] text-blue-600 font-semibold">{result.plan.taskCompletion}</p>
        </div>

        {/* D */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded">Do</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{result.do.totalActivity}</p>
          <ul className="space-y-0.5">
            {result.do.highlights.slice(0, 2).map((h, i) => (
              <li key={i} className="text-[11px] text-gray-600 dark:text-gray-400 flex gap-1">
                <span className="text-green-400 shrink-0">›</span>{h}
              </li>
            ))}
          </ul>
        </div>

        {/* C */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">Check</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">{result.check.insight}</p>
          {result.check.issues.slice(0, 1).map((issue, i) => (
            <p key={i} className="text-[11px] text-amber-700 flex gap-1">
              <span>⚠</span>{issue}
            </p>
          ))}
        </div>

        {/* A */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">Act</span>
          </div>
          <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1.5">来週の重点：</p>
          <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">{result.act.nextWeekFocus}</p>
          <ul className="mt-1.5 space-y-0.5">
            {result.act.improvements.slice(0, 1).map((imp, i) => (
              <li key={i} className="text-[11px] text-gray-600 dark:text-gray-400 flex gap-1">
                <span className="text-purple-400 shrink-0">›</span>{imp}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 良い点 / 課題 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">うまくいっている点</p>
          <ul className="space-y-1">
            {result.check.goodPoints.map((p, i) => (
              <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex gap-1.5">
                <span className="text-green-500 shrink-0">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">改善アクション</p>
          <ul className="space-y-1">
            {result.act.improvements.map((imp, i) => (
              <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex gap-1.5">
                <span className="text-purple-400 shrink-0">→</span>{imp}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AIからの一言 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg px-4 py-2.5 border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">💬 {result.act.encouragement}</p>
      </div>
    </div>
  );
}
