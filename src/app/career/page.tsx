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
  const { profile, loading, saveProfile, patchSelfAnalysis } = useProfile();
  const { showToast } = useToast();
  const [editData, setEditData] = useState<CareerFields | null>(null);
  const [saved, setSaved] = useState(false);
  const [applyingField, setApplyingField] = useState<string | null>(null);

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
  };

  const handleCancel = () => {
    setEditData(null);
  };

  const handleSave = async () => {
    if (!editData || !profile) return;
    await saveProfile({
      ...profile,
      ...editData,
    });
    setEditData(null);
    setSaved(true);
    showToast("保存しました", "success");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleApplyAi = async (key: keyof CareerFields, content: string) => {
    setApplyingField(key);
    await patchSelfAnalysis({ [key]: content } as Parameters<typeof patchSelfAnalysis>[0]);
    showToast("自己分析に反映しました", "success");
    setApplyingField(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">自己分析</h1>
        <p className="text-sm text-gray-500 mt-1">就活の軸・ガクチカ・自己PRを整理してESや面接のAI支援に活かします</p>
      </div>

      {/* 自己分析外部ツール案内 */}
      <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-900 mb-1">💡 自己分析をもっと深めるには</p>
        <p className="text-xs text-amber-700 mb-3">ここに書いた内容がAIコーチとPDCA分析に使われます。まだ言語化できていない人は下記ツールで整理してから入力しよう。</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "Claude・ChatGPT（対話で言語化）", url: "https://claude.ai/" },
            { name: "StrengthsFinder（強みを診断）", url: "https://www.gallup.com/cliftonstrengths/en/252137/home.aspx" },
            { name: "就活会議（業界研究・口コミ）", url: "https://syukatsu-kaigi.jp/" },
          ].map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-white border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
              {s.name} ↗
            </a>
          ))}
        </div>
      </div>

      {/* アクションバー */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {!isEditing && (
          <>
            <Button onClick={handleEdit}>
              {hasAnyContent ? "編集する" : "入力を始める"}
            </Button>
            {saved && <span className="text-sm text-green-600">保存しました ✓</span>}
          </>
        )}
        {isEditing && (
          <>
            <Button onClick={handleSave}>保存する</Button>
            <Button variant="secondary" onClick={handleCancel}>キャンセル</Button>
          </>
        )}
      </div>

      {/* セクション一覧 */}
      <div className="space-y-5">
        {SECTIONS.map((section) => {
          const aiContent = profile?.aiSelfAnalysis?.[section.key];
          const hasAiContent = !!aiContent?.trim();
          return (
            <div key={section.key} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{section.label}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{section.hint}</p>
                </div>
              </div>

              {isEditing ? (
                <>
                  <textarea
                    value={editData?.[section.key] ?? ""}
                    onChange={(e) =>
                      setEditData((prev) => prev ? { ...prev, [section.key]: e.target.value } : prev)
                    }
                    rows={section.rows}
                    placeholder={section.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {editData?.[section.key] && (
                    <p className="text-xs text-gray-400 text-right mt-1">
                      {editData[section.key]?.length ?? 0}字
                    </p>
                  )}
                  {hasAiContent && (
                    <div className="mt-3 bg-[#00c896]/5 border border-[#00c896]/20 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-[#00a87e] uppercase tracking-wider mb-1.5">カレオが生成したメモ（参考）</p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed mb-2">{aiContent}</p>
                      <button
                        type="button"
                        onClick={() => setEditData(prev => prev ? { ...prev, [section.key]: aiContent } : prev)}
                        className="text-[11px] font-medium text-[#00a87e] hover:text-[#00c896] transition-colors"
                      >
                        ↑ この内容を入力欄に反映
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="min-h-[60px]">
                    {current[section.key] ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {current[section.key]}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">未入力</p>
                    )}
                  </div>
                  {hasAiContent && (
                    <div className="mt-4 bg-[#00c896]/5 border border-[#00c896]/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-[#00a87e] uppercase tracking-wider">カレオのAIメモ</p>
                        <button
                          type="button"
                          disabled={applyingField === section.key}
                          onClick={() => handleApplyAi(section.key, aiContent ?? "")}
                          className="text-[11px] font-medium bg-[#00c896] hover:bg-[#00b586] disabled:opacity-50 text-white px-3 py-1 rounded-lg transition-colors"
                        >
                          {applyingField === section.key ? "反映中..." : "自己分析に反映する"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{aiContent}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 就活軸の成熟度グラフ（戦略4）*/}
      {!isEditing && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">自己分析の充実度</h3>
          <p className="text-xs text-gray-400 mb-4">カレオとの対話で自己分析が成長するほど、AIのアドバイス精度が上がります</p>
          <div className="space-y-3">
            {SECTIONS.map((section) => {
              const value = current[section.key];
              const len = value?.trim().length ?? 0;
              const level = len === 0 ? 0 : len < 50 ? 1 : len < 200 ? 2 : 3;
              const levelLabels = ["未入力", "入門", "充実", "完成"];
              const levelColors = ["bg-gray-200", "bg-amber-300", "bg-blue-400", "bg-emerald-500"];
              const pct = (level / 3) * 100;
              return (
                <div key={section.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{section.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      level === 0 ? "bg-gray-100 text-gray-400" :
                      level === 1 ? "bg-amber-100 text-amber-700" :
                      level === 2 ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {levelLabels[level]}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${levelColors[level]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              完成度が高いほどカレオのアドバイスが個別最適化されます
            </p>
            <a
              href="/chat"
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              カレオと対話して深める →
            </a>
          </div>
        </div>
      )}

      {/* 使われ方の説明 */}
      {!isEditing && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">この情報の活用先</h3>
          <div className="space-y-2">
            {[
              { icon: "📊", label: "PDCA分析", desc: "就活の軸・強み・弱みを踏まえてAIが週次レポートを個別最適化" },
              { icon: "🎯", label: "Next Action AI", desc: "あなたの強みに合った業界・企業・アクションを具体的に提案" },
              { icon: "💬", label: "カレオコーチ（AIチャット）", desc: "あなたの自己分析を把握した上で、個別相談・面接対策に対応" },
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
