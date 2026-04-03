"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SPI_QUESTIONS, SPI_SECTIONS, type SpiSection, type SpiQuestion } from "@/data/spiQuestions";

const STORAGE_KEY = "careo_spi_scores";

interface SessionResult {
  date: string;
  section: SpiSection | "全体";
  total: number;
  correct: number;
}

function loadHistory(): SessionResult[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SessionResult[];
  } catch {
    return [];
  }
}

function saveHistory(result: SessionResult) {
  const history = loadHistory();
  history.unshift(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
}

// 練習モード
function PracticeMode({
  questions,
  sectionLabel,
  onFinish,
}: {
  questions: SpiQuestion[];
  sectionLabel: SpiSection | "全体";
  onFinish: (correct: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState<Record<number, number>>({}); // index → selected

  const q = questions[currentIndex];
  const isAnswered = selected !== null || answered[currentIndex] !== undefined;
  const currentSelected = selected ?? answered[currentIndex] ?? null;
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = (i: number) => {
    if (isAnswered) return;
    setSelected(i);
    setAnswered((prev) => ({ ...prev, [currentIndex]: i }));
    if (i === q.answer) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    setSelected(null);
    setShowExplanation(false);
    if (isLast) {
      onFinish(correctCount + (selected === q.answer && !(currentIndex in answered) ? 1 : 0));
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const pct = Math.round((currentIndex / questions.length) * 100);

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{currentIndex + 1} / {questions.length}問</span>
        <span className="text-xs font-bold text-[#00c896]">{correctCount}問正解</span>
      </div>

      {/* 進捗バー */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[#00c896] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 問題 */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            q.section === "言語" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
          }`}>{q.section}</span>
          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.type}</span>
        </div>
        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed font-medium">{q.question}</p>
      </div>

      {/* 選択肢 */}
      <div className="space-y-2.5 mb-5">
        {q.choices.map((choice, i) => {
          const isSelected = currentSelected === i;
          const isCorrect = i === q.answer;
          let style = "border-gray-200 bg-white text-gray-700 hover:bg-gray-50";
          if (isAnswered) {
            if (isCorrect) style = "border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold";
            else if (isSelected && !isCorrect) style = "border-red-300 bg-red-50 text-red-700";
          } else if (isSelected) {
            style = "border-[#00c896] bg-[#00c896]/5 text-gray-900";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm transition-all ${style} disabled:cursor-default`}
            >
              <span className="flex items-start gap-2">
                <span className="shrink-0 font-bold">{["A", "B", "C", "D"][i]}.</span>
                <span>{choice.substring(3)}</span>
                {isAnswered && isCorrect && <span className="ml-auto shrink-0 text-emerald-600">✓</span>}
                {isAnswered && isSelected && !isCorrect && <span className="ml-auto shrink-0 text-red-500">✗</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* 解説 */}
      {isAnswered && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowExplanation((v) => !v)}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium mb-2 flex items-center gap-1"
          >
            {showExplanation ? "▲ 解説を閉じる" : "▼ 解説を見る"}
          </button>
          {showExplanation && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 mb-1.5">解説</p>
              <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* 次へボタン */}
      {isAnswered && (
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-[#00c896] text-white hover:bg-[#00b586] transition-colors"
        >
          {isLast ? "結果を見る" : "次の問題 →"}
        </button>
      )}
    </div>
  );
}

// 結果画面
function ResultScreen({
  correct,
  total,
  sectionLabel,
  onRetry,
  onHome,
}: {
  correct: number;
  total: number;
  sectionLabel: string;
  onRetry: () => void;
  onHome: () => void;
}) {
  const pct = Math.round((correct / total) * 100);
  const grade = pct >= 80 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "D";
  const gradeColor = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : pct >= 40 ? "text-amber-600" : "text-red-500";
  const gradeMsg = pct >= 80 ? "優秀！このまま自信を持って" : pct >= 60 ? "合格ライン。苦手問題を復習しよう" : pct >= 40 ? "もう少し練習が必要です" : "基礎から見直しましょう";

  return (
    <div className="text-center py-6">
      <p className="text-gray-500 text-sm mb-2">{sectionLabel} 練習結果</p>
      <p className={`text-7xl font-black mb-1 ${gradeColor}`}>{grade}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{correct} / {total}問</p>
      <p className="text-lg text-gray-600 mb-2">正答率 {pct}%</p>
      <p className="text-sm text-gray-500 mb-8">{gradeMsg}</p>

      <div className="flex gap-3 max-w-xs mx-auto">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          もう一度
        </button>
        <button
          type="button"
          onClick={onHome}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#00c896] text-white hover:bg-[#00b586] transition-colors"
        >
          ホームへ
        </button>
      </div>
    </div>
  );
}

export default function SpiPracticePage() {
  const [mode, setMode] = useState<"home" | "practice" | "result">("home");
  const [selectedSection, setSelectedSection] = useState<SpiSection | "全体">("全体");
  const [practiceQuestions, setPracticeQuestions] = useState<SpiQuestion[]>([]);
  const [lastResult, setLastResult] = useState<{ correct: number; total: number } | null>(null);
  const [history, setHistory] = useState<SessionResult[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const startPractice = (section: SpiSection | "全体") => {
    setSelectedSection(section);
    const pool = section === "全体" ? SPI_QUESTIONS : SPI_QUESTIONS.filter((q) => q.section === section);
    // シャッフル
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(pool.length, 20));
    setPracticeQuestions(shuffled);
    setMode("practice");
  };

  const handleFinish = (correct: number) => {
    const result: SessionResult = {
      date: new Date().toLocaleDateString("ja-JP"),
      section: selectedSection,
      total: practiceQuestions.length,
      correct,
    };
    saveHistory(result);
    setLastResult({ correct, total: practiceQuestions.length });
    setHistory(loadHistory());
    setMode("result");
  };

  const handleRetry = () => {
    startPractice(selectedSection);
  };

  const langQuestions = SPI_QUESTIONS.filter((q) => q.section === "言語");
  const mathQuestions = SPI_QUESTIONS.filter((q) => q.section === "非言語");

  if (mode === "practice") {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <button type="button" onClick={() => setMode("home")} className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
          ← 練習モード選択に戻る
        </button>
        <PracticeMode
          questions={practiceQuestions}
          sectionLabel={selectedSection}
          onFinish={handleFinish}
        />
      </div>
    );
  }

  if (mode === "result" && lastResult) {
    return (
      <div className="p-4 md:p-8 max-w-2xl">
        <ResultScreen
          correct={lastResult.correct}
          total={lastResult.total}
          sectionLabel={selectedSection}
          onRetry={handleRetry}
          onHome={() => setMode("home")}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/tests" className="text-sm text-gray-400 hover:text-gray-600 mb-1 inline-block">
            ← 筆記試験管理
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">SPI練習問題</h1>
          <p className="text-sm text-gray-500 mt-1">全{SPI_QUESTIONS.length}問（言語{langQuestions.length}問・非言語{mathQuestions.length}問）</p>
        </div>
      </div>

      {/* セクション選択 */}
      <div className="grid gap-4 mb-8 md:grid-cols-3">
        {(["全体", ...SPI_SECTIONS] as const).map((section) => {
          const count = section === "全体" ? SPI_QUESTIONS.length : SPI_QUESTIONS.filter((q) => q.section === section).length;
          const color = section === "全体" ? "border-[#00c896] bg-[#00c896]/5" : section === "言語" ? "border-blue-200 bg-blue-50" : "border-purple-200 bg-purple-50";
          const btnColor = section === "全体" ? "bg-[#00c896] text-white hover:bg-[#00b586]" : section === "言語" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-purple-600 text-white hover:bg-purple-700";
          return (
            <div key={section} className={`rounded-xl border-2 p-5 ${color}`}>
              <p className="font-bold text-gray-900 text-lg mb-0.5">{section}</p>
              <p className="text-sm text-gray-500 mb-4">
                {section === "全体" ? "言語+非言語ランダム" : section === "言語" ? "語句・文章・関係" : "計算・確率・推論"}
                （{Math.min(count, 20)}問出題）
              </p>
              <button
                type="button"
                onClick={() => startPractice(section)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${btnColor}`}
              >
                練習を始める
              </button>
            </div>
          );
        })}
      </div>

      {/* 過去の成績 */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">過去の成績（直近20回）</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2">日付</th>
                  <th className="text-left pb-2">セクション</th>
                  <th className="text-right pb-2">正答数</th>
                  <th className="text-right pb-2">正答率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((r, i) => {
                  const pct = Math.round((r.correct / r.total) * 100);
                  return (
                    <tr key={i} className="text-sm">
                      <td className="py-2 text-gray-500">{r.date}</td>
                      <td className="py-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          r.section === "言語" ? "bg-blue-100 text-blue-700" :
                          r.section === "非言語" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>{r.section}</span>
                      </td>
                      <td className="py-2 text-right text-gray-700">{r.correct}/{r.total}</td>
                      <td className={`py-2 text-right font-semibold ${
                        pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : "text-amber-600"
                      }`}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 参考書リンク */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className="text-xs text-gray-400 font-medium mb-3">📚 SPI対策本を探す（Amazon）</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "SPI3完全問題集", url: "https://www.amazon.co.jp/s?k=SPI3+完全問題集&tag=careo-22" },
            { label: "テストセンター対策", url: "https://www.amazon.co.jp/s?k=テストセンター+対策+問題集&tag=careo-22" },
            { label: "言語問題集", url: "https://www.amazon.co.jp/s?k=SPI+言語+問題集&tag=careo-22" },
            { label: "非言語問題集", url: "https://www.amazon.co.jp/s?k=SPI+非言語+問題集&tag=careo-22" },
          ].map(({ label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-full transition-colors"
            >
              {label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
