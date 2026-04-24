"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KareoCharacter, type KareoExpression } from "@/components/kareo/KareoCharacter";
import { useProfile } from "@/hooks/useProfile";

export interface TutorialStep {
  title: string;
  description: string;
  emoji?: string;
  tips?: readonly string[];
}

interface PageTutorialProps {
  /** Unique key for localStorage (e.g., "interviews-recording") */
  pageKey: string;
  /** Page title shown at top */
  pageTitle: string;
  /** Tutorial steps */
  steps: readonly TutorialStep[];
  /** Kareo expression for the tutorial */
  kareoExpression?: KareoExpression;
  /** このチュートリアルのバージョン（機能大幅変更時に bump すると再表示される）*/
  version?: string;
}

// 新規ユーザーと判定する期間（日数）
const NEW_USER_WINDOW_DAYS = 14;

export function PageTutorial({ pageKey, pageTitle, steps, kareoExpression = "waving", version = "v1" }: PageTutorialProps) {
  const { profile, loading } = useProfile();
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const storageKey = `careo_tutorial_${pageKey}_${version}`;

  useEffect(() => {
    if (loading) return;
    if (!profile?.createdAt) return;
    try {
      if (localStorage.getItem(storageKey)) return;
      // 登録から14日以内の新規ユーザーのみ表示
      const accountAgeDays = (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeDays <= NEW_USER_WINDOW_DAYS) {
        setShow(true);
      } else {
        // 古参ユーザーは見ない扱いに（同じバージョンは二度と出さない）
        try { localStorage.setItem(storageKey, "auto-dismissed-existing-user"); } catch {}
      }
    } catch {}
  }, [storageKey, profile?.createdAt, loading]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={dismiss} />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-[#00c896] to-[#00a87e] px-6 pt-6 pb-10 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />

            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white/70 text-xs font-medium mb-1">はじめてのガイド</p>
                <h2 className="text-xl font-bold">{pageTitle}</h2>
              </div>
              <div className="w-16 h-16 shrink-0 -mr-1 -mt-1 drop-shadow-lg">
                <KareoCharacter expression={kareoExpression} size={64} animate={false} />
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="px-6 -mt-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-3">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "bg-[#00c896] flex-[2]"
                        : i < currentStep
                        ? "bg-[#00c896]/30 flex-1"
                        : "bg-gray-200 flex-1"
                    }`}
                  />
                ))}
              </div>

              <p className="text-[10px] text-gray-400 font-medium mb-2">
                STEP {currentStep + 1} / {steps.length}
              </p>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {step.emoji && <span className="text-xl">{step.emoji}</span>}
                    <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {step.description}
                  </p>

                  {step.tips && step.tips.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                      {step.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-[#00c896] shrink-0 mt-0.5">💡</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              スキップ
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prev}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  戻る
                </button>
              )}
              <button
                onClick={next}
                className="px-5 py-2.5 bg-[#00c896] text-white text-sm font-semibold rounded-xl hover:bg-[#00b386] transition-colors shadow-sm"
              >
                {isLast ? "はじめる" : "次へ"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Pre-defined tutorial configs for each page */
export const PAGE_TUTORIALS = {
  "interviews-recording": {
    pageTitle: "面接録音AI",
    kareoExpression: "encouraging" as const,
    steps: [
      {
        emoji: "🎙️",
        title: "面接の録音をAIが分析",
        description: "オンライン面接の録音や、面接メモからAIが詳細なフィードバックを提供します。回答の品質スコア、改善点、模範回答まで一気にわかります。",
        tips: ["Zoom・Teams・Google Meetの録音ファイルに対応", "テキストの貼り付けだけでもOK"],
      },
      {
        emoji: "📝",
        title: "3つの入力方法",
        description: "「テキスト貼り付け」「音声アップロード」「ブラウザ録音」から選べます。音声ファイルはGemini AIが自動で文字起こしします。",
        tips: ["一番簡単なのはテキスト貼り付け", "音声アップロードならMP3/WAV/M4Aに対応", "面接官と自分の発言を区別して書くとより精度UP"],
      },
      {
        emoji: "📊",
        title: "AIフィードバックの見方",
        description: "総合スコア（100点満点）、良かった点・改善点、設問ごとの分析、コミュニケーション評価のレーダーチャートが表示されます。",
        tips: ["設問をクリックすると詳細と改善回答例が見れる", "何度でも再分析OK"],
      },
    ],
  },
  companies: {
    pageTitle: "企業管理",
    kareoExpression: "default" as const,
    steps: [
      {
        emoji: "🏢",
        title: "就活企業を一元管理",
        description: "気になる企業をすべてここで管理。選考ステータス、メモ、マイページ情報を集約して「今どこまで進んでるか」が一目でわかります。",
      },
      {
        emoji: "📋",
        title: "リスト表示 ＆ カンバン表示",
        description: "PC版ではリスト表示とカンバン表示を切り替えられます。カンバンならドラッグ＆ドロップでステータス変更もかんたん。",
        tips: ["カンバンの列: 気になる → 応募中 → 書類 → 面接中 → 内定/不合格", "スマホではスワイプでクイック操作"],
      },
      {
        emoji: "🔑",
        title: "マイページID管理",
        description: "企業詳細ページで「マイページ管理」を開くとID・パスワードを保存できます。ワンクリックでマイページを開けるので、30社以上でも迷いません。",
      },
    ],
  },
  es: {
    pageTitle: "ES管理",
    kareoExpression: "thinking" as const,
    steps: [
      {
        emoji: "📄",
        title: "ESを一か所で管理",
        description: "企業ごとのES（エントリーシート）を締切・ステータスと一緒に管理。提出前にAIチェックも受けられます。",
      },
      {
        emoji: "🤖",
        title: "AI機能を活用",
        description: "「AI生成」で設問に合わせた下書きを自動生成。「AI添削」で文章の改善点を指摘。「AI校正」で誤字脱字をチェック。",
        tips: ["自己分析データが充実しているほど精度UP", "企業ごとにES内容の矛盾もAIが検出"],
      },
      {
        emoji: "📊",
        title: "通過率を記録＆共有",
        description: "ESの結果（通過/不通過）を記録すると、コミュニティの匿名データから人気設問の通過率がわかります。",
      },
    ],
  },
  interviews: {
    pageTitle: "面接ログ",
    kareoExpression: "encouraging" as const,
    steps: [
      {
        emoji: "👥",
        title: "面接を記録して振り返り",
        description: "面接の日程、ラウンド、結果、メモを記録。過去の面接データをAIが分析して次の面接に活かせます。",
      },
      {
        emoji: "🎙️",
        title: "面接録音AIと連携",
        description: "面接詳細ページから「面接録音AI」に飛べます。録音データをAIが分析してスコアリングと改善提案をしてくれます。",
        tips: ["サイドバーの「面接録音AI」からも直接アクセスOK"],
      },
    ],
  },
  chat: {
    pageTitle: "カレオコーチ",
    kareoExpression: "waving" as const,
    steps: [
      {
        emoji: "💬",
        title: "あなた専属のAI就活コーチ",
        description: "カレオはあなたのES・面接・企業データをすべて把握した上でアドバイスします。ChatGPTと違い、毎回説明する必要はありません。",
      },
      {
        emoji: "🎯",
        title: "こんなことを聞いてみよう",
        description: "「A社のES添削して」「次の面接で聞かれそうなことは？」「志望動機の書き方が分からない」など、就活に関することなら何でもOK。",
        tips: ["自己分析・企業データが充実するほど的確なアドバイスに", "1日の回数制限あり（無料プラン）"],
      },
    ],
  },
  career: {
    pageTitle: "自己分析",
    kareoExpression: "thinking" as const,
    steps: [
      {
        emoji: "💡",
        title: "自己分析をAIと一緒に",
        description: "就活軸、ガクチカ、自己PR、強み・弱みをここで管理。AIが対話形式で深掘りのサポートをしてくれます。",
      },
      {
        emoji: "🔄",
        title: "他の機能と連動",
        description: "ここで入力した自己分析データは、ES生成・面接対策・PDCAレポートなどすべてのAI機能に反映されます。充実させるほどCareo全体の精度が上がります。",
      },
    ],
  },
  report: {
    pageTitle: "PDCAレポート",
    kareoExpression: "default" as const,
    steps: [
      {
        emoji: "📊",
        title: "就活のPDCAを自動分析",
        description: "あなたの就活データ（応募数・面接結果・ES通過率など）をAIが毎週分析。Plan-Do-Check-Actのサイクルをスコア化します。",
        tips: ["データが蓄積するほどレポートの精度が上がります"],
      },
    ],
  },
  deadlines: {
    pageTitle: "締切一覧",
    kareoExpression: "encouraging" as const,
    steps: [
      {
        emoji: "⏰",
        title: "締切を見逃さない",
        description: "ES提出・面接・説明会の締切をまとめて表示。赤（今日）・黄（明日）・青（2-3日以内）で色分けされるので、優先順位が一目でわかります。",
      },
    ],
  },
  "ob-visits": {
    pageTitle: "OB/OG訪問",
    kareoExpression: "waving" as const,
    steps: [
      {
        emoji: "🤝",
        title: "OB/OG訪問を記録",
        description: "訪問先・目的・得た知見・印象をメモ。記録したデータはAIコーチが参照して、ES作成時の志望動機に活かす提案をしてくれます。",
      },
    ],
  },
  tests: {
    pageTitle: "筆記試験",
    kareoExpression: "thinking" as const,
    steps: [
      {
        emoji: "📝",
        title: "筆記試験のスコアを管理",
        description: "SPI・TG-WEB・玉手箱などの試験タイプ、言語/非言語/英語のスコアを記録。結果の推移を把握して弱点を分析できます。",
      },
    ],
  },
  calendar: {
    pageTitle: "カレンダー",
    kareoExpression: "default" as const,
    steps: [
      {
        emoji: "📅",
        title: "就活スケジュールを可視化",
        description: "面接・ES締切・説明会・OB訪問をカレンダー上に表示。忙しい週と空いている週が一目でわかります。",
      },
    ],
  },
  events: {
    pageTitle: "説明会・インターン",
    kareoExpression: "default" as const,
    steps: [
      {
        emoji: "🎯",
        title: "説明会・インターンを管理",
        description: "参加予定の説明会、インターンシップ、セミナーを記録。企業との紐付けで選考管理と連携します。",
      },
    ],
  },
  settings: {
    pageTitle: "設定",
    kareoExpression: "waving" as const,
    steps: [
      {
        emoji: "⚙️",
        title: "Careoをカスタマイズ",
        description: "外観（ダークモード・フォント）の変更、コーチの選択、プッシュ通知の設定、キャリアセンター連携などを管理できます。",
      },
    ],
  },
  "weekly-coach": {
    pageTitle: "週次コーチ",
    kareoExpression: "encouraging" as const,
    steps: [
      {
        emoji: "🏃",
        title: "毎週のコーチングレポート",
        description: "今週やったこと・来週やるべきことをAIが自動でまとめます。振り返りと次のアクションが明確になります。",
      },
    ],
  },
} as const;
