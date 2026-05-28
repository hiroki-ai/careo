"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { AxisLayers, FutureVision, StrengthWithEvidence, JobRolePriority } from "@/types";

type SaveState = "idle" | "saving" | "saved";

export function IdentityEditor() {
  const { profile, patchIdentity } = useProfile();
  const { showToast } = useToast();

  const [axisLayers, setAxisLayers] = useState<AxisLayers>({});
  const [vision5y, setVision5y] = useState<FutureVision>({});
  const [vision10y, setVision10y] = useState<FutureVision>({});
  const [strengths, setStrengths] = useState<StrengthWithEvidence[]>([]);
  const [roles, setRoles] = useState<JobRolePriority[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    if (!profile) return;
    setAxisLayers(profile.axisLayers ?? {});
    setVision5y(profile.vision5y ?? {});
    setVision10y(profile.vision10y ?? {});
    setStrengths(profile.strengthsWithEvidence ?? []);
    setRoles(profile.jobRolePriorities ?? []);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaveState("saving");
    const ok = await patchIdentity({
      axisLayers,
      vision5y,
      vision10y,
      strengthsWithEvidence: strengths,
      jobRolePriorities: roles,
    });
    setSaveState(ok ? "saved" : "idle");
    if (ok) {
      showToast("Identity を保存しました", "success");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      showToast("保存に失敗しました", "error");
    }
  };

  // --- 強み の追加・削除・編集ヘルパ ---
  const addStrength = () =>
    setStrengths([...strengths, { name: "", description: "", evidences: [""] }]);
  const removeStrength = (i: number) =>
    setStrengths(strengths.filter((_, idx) => idx !== i));
  const updateStrength = (i: number, patch: Partial<StrengthWithEvidence>) =>
    setStrengths(strengths.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addEvidence = (i: number) =>
    updateStrength(i, { evidences: [...strengths[i].evidences, ""] });
  const removeEvidence = (i: number, ei: number) =>
    updateStrength(i, { evidences: strengths[i].evidences.filter((_, x) => x !== ei) });
  const updateEvidence = (i: number, ei: number, value: string) =>
    updateStrength(i, {
      evidences: strengths[i].evidences.map((e, x) => (x === ei ? value : e)),
    });

  // --- 職種優先順位 の追加・削除・編集ヘルパ ---
  const addRole = () =>
    setRoles([...roles, { rank: roles.length + 1, role: "", reason: "" }]);
  const removeRole = (i: number) =>
    setRoles(roles.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, rank: idx + 1 })));
  const updateRole = (i: number, patch: Partial<JobRolePriority>) =>
    setRoles(roles.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const moveRole = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= roles.length) return;
    const next = [...roles];
    [next[i], next[j]] = [next[j], next[i]];
    setRoles(next.map((r, idx) => ({ ...r, rank: idx + 1 })));
  };

  return (
    <div className="space-y-6">
      {/* 軸の3層構造 */}
      <Section emoji="🏛" title="軸の3層構造" desc="本人の核となる「なぜ働くのか」を3層で整理（最深層→中間層→表層）">
        <FieldLabel>最深層（人格の核）</FieldLabel>
        <TextArea
          value={axisLayers.deepest ?? ""}
          onChange={(v) => setAxisLayers({ ...axisLayers, deepest: v })}
          placeholder="例: 期待・信頼を背負って人を喜ばせたい本能"
        />
        <FieldLabel>中間層（能力）</FieldLabel>
        <TextArea
          value={axisLayers.middle ?? ""}
          onChange={(v) => setAxisLayers({ ...axisLayers, middle: v })}
          placeholder="例: 価値を届ける／場を設計する力"
        />
        <FieldLabel>表層（行動・経験）</FieldLabel>
        <TextArea
          value={axisLayers.surface ?? ""}
          onChange={(v) => setAxisLayers({ ...axisLayers, surface: v })}
          placeholder="例: 113名サークル幹部・長期インターン・Careo個人開発"
        />
      </Section>

      {/* 5年後ビジョン */}
      <Section emoji="🌅" title="5年後ビジョン" desc="この企業で5年後にどう成長していたいか">
        <VisionFields vision={vision5y} onChange={setVision5y} />
      </Section>

      {/* 10年後ビジョン */}
      <Section emoji="🌄" title="10年後ビジョン" desc="10年後の自分の状態">
        <VisionFields vision={vision10y} onChange={setVision10y} />
      </Section>

      {/* 強み×証拠 */}
      <Section emoji="💪" title="強み × 証拠エピソード" desc="面接の鉄板。強み1つにつき具体エピソードを複数紐づける">
        {strengths.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            まだ強みが登録されていません。「＋ 強みを追加」を押してください。
          </p>
        )}
        {strengths.map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <FieldLabel>強みの名前</FieldLabel>
                <Input
                  value={s.name}
                  onChange={(v) => updateStrength(i, { name: v })}
                  placeholder="例: 信頼を背負う力"
                />
              </div>
              <button
                type="button"
                onClick={() => removeStrength(i)}
                className="text-xs text-red-500 hover:text-red-700 mt-7"
              >
                削除
              </button>
            </div>
            <div>
              <FieldLabel>説明</FieldLabel>
              <TextArea
                value={s.description ?? ""}
                onChange={(v) => updateStrength(i, { description: v })}
                placeholder="この強みが具体的にどういう力か（1-2文）"
                rows={2}
              />
            </div>
            <div>
              <FieldLabel>証拠エピソード</FieldLabel>
              <div className="space-y-1.5">
                {s.evidences.map((e, ei) => (
                  <div key={ei} className="flex gap-2">
                    <input
                      type="text"
                      value={e}
                      onChange={(ev) => updateEvidence(i, ei, ev.target.value)}
                      placeholder="例: サークル幹部で113名動員（過去最多）"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => removeEvidence(i, ei)}
                      className="text-xs text-gray-400 hover:text-red-500 px-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addEvidence(i)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  ＋ エピソードを追加
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addStrength}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          ＋ 強みを追加
        </button>
      </Section>

      {/* 職種優先順位 */}
      <Section emoji="🎯" title="職種の優先順位" desc="自分に合う職種を順位付け（1が最優先）">
        {roles.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            まだ職種が登録されていません。
          </p>
        )}
        {roles.map((r, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-2">
            <div className="flex flex-col items-center pt-1">
              <button
                type="button"
                onClick={() => moveRole(i, -1)}
                disabled={i === 0}
                className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs"
                title="上へ"
              >
                ▲
              </button>
              <span className="text-xs font-bold text-gray-700 my-1">{r.rank}</span>
              <button
                type="button"
                onClick={() => moveRole(i, 1)}
                disabled={i === roles.length - 1}
                className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs"
                title="下へ"
              >
                ▼
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={r.role}
                onChange={(v) => updateRole(i, { role: v })}
                placeholder="例: 戦略・企画型（戦略コンサル / 経営企画 / 事業企画）"
              />
              <Input
                value={r.reason ?? ""}
                onChange={(v) => updateRole(i, { reason: v })}
                placeholder="選定理由を一言で"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRole(i)}
              className="text-xs text-red-500 hover:text-red-700 mt-2 px-2"
            >
              削除
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRole}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          ＋ 職種を追加
        </button>
      </Section>

      {/* 保存ボタン */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saveState === "saving"}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium rounded-lg shadow-lg"
        >
          {saveState === "saving" ? "保存中…" : saveState === "saved" ? "✓ 保存しました" : "Identity を保存"}
        </button>
      </div>
    </div>
  );
}

function Section({
  emoji,
  title,
  desc,
  children,
}: {
  emoji: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>{emoji}</span>
          {title}
        </h2>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-400"
    />
  );
}

function VisionFields({
  vision,
  onChange,
}: {
  vision: FutureVision;
  onChange: (v: FutureVision) => void;
}) {
  return (
    <>
      <div>
        <FieldLabel>年齢</FieldLabel>
        <input
          type="number"
          value={vision.age ?? ""}
          onChange={(e) =>
            onChange({ ...vision, age: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="28"
          className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>
      <div>
        <FieldLabel>キャリア・仕事面</FieldLabel>
        <TextArea
          value={vision.career ?? ""}
          onChange={(v) => onChange({ ...vision, career: v })}
          placeholder='例: 「君だから任せたい」と言われる人になっている'
        />
      </div>
      <div>
        <FieldLabel>ライフスタイル・家庭面</FieldLabel>
        <TextArea
          value={vision.lifestyle ?? ""}
          onChange={(v) => onChange({ ...vision, lifestyle: v })}
          placeholder="例: 結婚・家庭と仕事の両立"
        />
      </div>
      <div>
        <FieldLabel>人脈・繋がり</FieldLabel>
        <TextArea
          value={vision.network ?? ""}
          onChange={(v) => onChange({ ...vision, network: v })}
          placeholder="例: 業界内のキーパーソンと繋がっている"
          rows={2}
        />
      </div>
      <div>
        <FieldLabel>収入の目安</FieldLabel>
        <Input
          value={vision.income ?? ""}
          onChange={(v) => onChange({ ...vision, income: v })}
          placeholder="例: 年収1,000万円超"
        />
      </div>
    </>
  );
}
