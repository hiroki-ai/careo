"use client";

import { useState, useMemo } from "react";
import { Company, OpenworkRatings, OPENWORK_AXIS_LABELS } from "@/types";
import { useToast } from "@/components/ui/Toast";

type Props = {
  company: Company;
  onUpdate: (patch: Partial<Company>) => Promise<void>;
};

const CENTER = 110;
const RADIUS = 90;
const MAX_VALUE = 5;

function polar(deg: number, r: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

export function OpenworkRadar({ company, onUpdate }: Props) {
  const ratings = company.openwork_ratings ?? {};
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<OpenworkRatings>(ratings);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const hasData = useMemo(() => {
    return OPENWORK_AXIS_LABELS.some((a) => ratings[a.key] != null);
  }, [ratings]);

  const startEdit = () => {
    setDraft(ratings);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onUpdate({ openwork_ratings: draft });
      showToast("口コミ評価を保存しました", "success");
      setEditing(false);
    } catch {
      showToast("保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  // SVG レーダーチャート用ポイント計算
  const points = OPENWORK_AXIS_LABELS.map((a, i) => {
    const angle = (360 / OPENWORK_AXIS_LABELS.length) * i;
    const value = ratings[a.key];
    const r = value != null ? (value / MAX_VALUE) * RADIUS : 0;
    return { ...polar(angle, r), angle, label: a.label, value };
  });

  const gridRings = [1, 2, 3, 4, 5];

  return (
    <div className="bg-white rounded-xl border border-gray-100 mb-6 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>📊</span>
            Openwork 口コミ評価
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            8軸の社員評価（1.0-5.0）＋ 残業/有休/総合。Openwork で確認した数値を入力すると視覚化します
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg whitespace-nowrap"
          >
            {hasData ? "編集" : "入力"}
          </button>
        )}
      </div>

      {company.openwork_url && (
        <div className="mb-3">
          <a
            href={company.openwork_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-700 hover:text-cyan-800 hover:underline"
          >
            🔗 Openwork で確認 →
          </a>
        </div>
      )}

      {!hasData && !editing && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
          まだ口コミ評価が入力されていません。
          <br />
          「入力」を押して Openwork の数値を反映させてください。
        </div>
      )}

      {hasData && !editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* レーダーチャート */}
          <div className="flex justify-center">
            <svg width={220} height={220} viewBox="0 0 220 220" aria-label="Openwork 評価レーダーチャート">
              {/* グリッド */}
              {gridRings.map((ring) => (
                <polygon
                  key={ring}
                  points={OPENWORK_AXIS_LABELS.map((_, i) => {
                    const p = polar((360 / OPENWORK_AXIS_LABELS.length) * i, (ring / MAX_VALUE) * RADIUS);
                    return `${p.x},${p.y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={ring === MAX_VALUE ? 1 : 0.5}
                />
              ))}
              {/* 軸線 */}
              {OPENWORK_AXIS_LABELS.map((_, i) => {
                const p = polar((360 / OPENWORK_AXIS_LABELS.length) * i, RADIUS);
                return (
                  <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth={0.5} />
                );
              })}
              {/* データ */}
              <polygon
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="rgba(0,200,150,.25)"
                stroke="#00c896"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill="#00c896" />
              ))}
              {/* ラベル */}
              {OPENWORK_AXIS_LABELS.map((a, i) => {
                const lp = polar((360 / OPENWORK_AXIS_LABELS.length) * i, RADIUS + 14);
                return (
                  <text
                    key={a.key}
                    x={lp.x}
                    y={lp.y}
                    fontSize={9}
                    fontWeight={600}
                    fill="#374151"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {a.label}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* 数値リスト */}
          <div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {OPENWORK_AXIS_LABELS.map((a) => (
                <div key={a.key} className="flex justify-between border-b border-gray-100 py-1.5">
                  <span className="text-gray-600">{a.label}</span>
                  <span className="font-bold text-gray-900">
                    {ratings[a.key] != null ? ratings[a.key]?.toFixed(1) : <span className="text-gray-300 font-normal">-</span>}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
              <div>
                <div className="text-gray-500">総合</div>
                <div className="font-bold text-emerald-700 text-base">
                  {ratings.totalScore != null ? ratings.totalScore.toFixed(1) : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">残業/月</div>
                <div className="font-bold text-gray-900">
                  {ratings.overtimeHours != null ? `${ratings.overtimeHours}h` : "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">有休消化</div>
                <div className="font-bold text-gray-900">
                  {ratings.paidLeaveRate != null ? `${ratings.paidLeaveRate}%` : "-"}
                </div>
              </div>
            </div>
            {ratings.memo && (
              <p className="text-xs text-gray-600 mt-3 leading-relaxed border-t border-gray-100 pt-2">
                📝 {ratings.memo}
              </p>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {OPENWORK_AXIS_LABELS.map((a) => (
              <RatingField
                key={a.key}
                label={a.label}
                value={draft[a.key]}
                onChange={(v) => setDraft({ ...draft, [a.key]: v })}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
            <RatingField
              label="総合スコア"
              value={draft.totalScore}
              onChange={(v) => setDraft({ ...draft, totalScore: v })}
            />
            <NumberField
              label="残業時間/月"
              suffix="時間"
              value={draft.overtimeHours}
              onChange={(v) => setDraft({ ...draft, overtimeHours: v })}
            />
            <NumberField
              label="有休消化率"
              suffix="%"
              value={draft.paidLeaveRate}
              onChange={(v) => setDraft({ ...draft, paidLeaveRate: v })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ソースURL（Openwork等）</label>
            <input
              type="url"
              value={draft.sourceUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })}
              placeholder="https://www.openwork.jp/..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">メモ（口コミハイライト等）</label>
            <textarea
              value={draft.memo ?? ""}
              onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
              rows={2}
              placeholder="例: 「20代の裁量大」「上司との距離近い」など印象的だった口コミ"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v?: number) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">{label}</label>
      <input
        type="number"
        min={0}
        max={5}
        step={0.1}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder="3.5"
        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix?: string;
  value?: number;
  onChange: (v?: number) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">{label}{suffix ? `（${suffix}）` : ""}</label>
      <input
        type="number"
        min={0}
        step={0.1}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );
}
