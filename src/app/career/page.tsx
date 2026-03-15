"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { UserProfile } from "@/types";
import { useToast } from "@/components/ui/Toast";

type CareerFields = Pick<UserProfile, "careerAxis" | "gakuchika" | "selfPr" | "strengths" | "weaknesses">;

const SECTIONS: {
  key: keyof CareerFields;
  label: string;
  placeholder: string;
  hint: string;
  rows: number;
}[] = [
  {
    key: "careerAxis",
    label: "就活の軸",
    placeholder: "例: 人々の生活を直接改善できる事業に関わりたい。チームで課題解決するカルチャーがある会社を重視する。成長投資に積極的な環境であること。",
    hint: "なぜ働くのか、どんな環境・仕事を求めているか、譲れない価値観",
    rows: 4,
  },
  {
    key: "gakuchika",
    label: "ガクチカ（学生時代頑張ったこと）",
    placeholder: "例: 〇〇部のキャプテンとして部員30名をまとめ、地区大会優勝を達成した。課題は...",
    hint: "状況 → 課題 → 自分の行動 → 結果の流れで書くと伝わりやすい",
    rows: 6,
  },
  {
    key: "selfPr",
    label: "自己PR",
    placeholder: "例: 私の強みは「巻き込み力」です。アルバイト先で...",
    hint: "強みをエピソードで示し、入社後どう活かすかまで書く",
    rows: 5,
  },
  {
    key: "strengths",
    label: "強み",
    placeholder: "例:\n・主体性：〇〇のときに...\n・論理的思考：〇〇の場面で...\n・粘り強さ：〇〇を乗り越えて...",
    hint: "具体的なエピソードの根拠とセットで3点程度",
    rows: 4,
  },
  {
    key: "weaknesses",
    label: "弱み・克服策",
    placeholder: "例: 完璧主義で時間をかけすぎる傾向がある。対策として...",
    hint: "正直な弱みと、どう改善しているかをセットで",
    rows: 3,
  },
];

export default function CareerPage() {
  const { profile, loading, saveProfile } = useProfile();
  const { showToast } = useToast();
  const [editData, setEditData] = useState<CareerFields | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<CareerFields | null>(null);
  const [saved, setSaved] = useState(false);

  if (loading) return <div className="p-8 text-gray-400 text-sm">読み込み中...</div>;

  const current: CareerFields = {
    careerAxis: profile?.careerAxis ?? "",
    gakuchika: profile?.gakuchika ?? "",
    selfPr: profile?.selfPr ?? "",
    strengths: profile?.strengths ?? "",
    weaknesses: profile?.weaknesses ?? "",
  };

  const hasAnyContent = Object.values(current).some(v => v && v.trim().length > 0);
  const isEditing = editData !== null;

  const handleEdit = () => {
    setSaved(false);
    setEditData({ ...current });
    setAiDraft(null);
  };

  const handleCancel = () => {
    setEditData(null);
    setAiDraft(null);
  };

  const handleSave = async () => {
    if (!editData || !profile) return;
    await saveProfile({
      ...profile,
      ...editData,
    });
    setEditData(null);
    setAiDraft(null);
    setSaved(true);
    showToast("保存しました", "success");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAiGenerate = async () => {
    if (!profile) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/career-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!data.error) {
        const draft: CareerFields = {
          careerAxis: data.careerAxis ?? "",
          gakuchika: data.gakuchika ?? "",
          selfPr: data.selfPr ?? "",
          strengths: data.strengths ?? "",
          weaknesses: data.weaknesses ?? "",
        };
        setAiDraft(draft);
        setEditData(draft); // ドラフトを編集フォームに反映
      }
    } catch (err) {
      console.error("[career-suggest]", err);
      showToast("AI下書き生成に失敗しました", "error");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">自己分析</h1>
        <p className="text-sm text-gray-500 mt-1">就活の軸・ガクチカ・自己PRを整理してESや面接のAI支援に活かします</p>
      </div>

      {/* アクションバー */}
      <div className="flex items-center gap-3 mb-6">
        {!isEditing && (
          <>
            <Button onClick={handleEdit}>
              {hasAnyContent ? "編集する" : "入力を始める"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { handleEdit(); handleAiGenerate(); }}
              disabled={aiLoading || !profile}
            >
              {aiLoading ? "AIが考え中..." : "✨ AIと一緒に考える"}
            </Button>
            {saved && <span className="text-sm text-green-600">保存しました ✓</span>}
          </>
        )}
        {isEditing && (
          <>
            <Button onClick={handleSave}>保存する</Button>
            <Button variant="secondary" onClick={handleCancel}>キャンセル</Button>
            <Button
              variant="ghost"
              onClick={handleAiGenerate}
              disabled={aiLoading}
            >
              {aiLoading ? "生成中..." : "✨ AIで下書きを生成"}
            </Button>
          </>
        )}
      </div>

      {/* AI下書き通知バナー */}
      {aiDraft && isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <p className="text-sm text-blue-800 font-medium">✨ AIが下書きを生成しました</p>
          <p className="text-xs text-blue-600 mt-0.5">
            あなたのプロフィールをもとにしたたたき台です。実際の体験に書き換えて使ってください。
          </p>
        </div>
      )}

      {/* セクション一覧 */}
      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.key} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">{section.label}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{section.hint}</p>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editData?.[section.key] ?? ""}
                onChange={(e) =>
                  setEditData((prev) => prev ? { ...prev, [section.key]: e.target.value } : prev)
                }
                rows={section.rows}
                placeholder={section.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <div className="min-h-[60px]">
                {current[section.key] ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {current[section.key]}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">未入力</p>
                )}
              </div>
            )}

            {isEditing && editData?.[section.key] && (
              <p className="text-xs text-gray-400 text-right mt-1">
                {editData[section.key]?.length ?? 0}字
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 使われ方の説明 */}
      {!isEditing && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">この情報の活用先</h3>
          <div className="space-y-2">
            {[
              { icon: "📝", label: "ES自動生成", desc: "設問に合わせてガクチカ・就活の軸から回答を自動作成" },
              { icon: "🤖", label: "Next Action AI", desc: "あなたの強みに合った業界・企業へのアドバイスを精度UP" },
              { icon: "💬", label: "カレオ（AI相談）", desc: "あなたの自己分析を把握した上で、個別相談に対応" },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 items-start">
                <span className="text-lg shrink-0">{item.icon}</span>
                <div>
                  <span className="text-sm font-medium text-gray-800">{item.label}</span>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
