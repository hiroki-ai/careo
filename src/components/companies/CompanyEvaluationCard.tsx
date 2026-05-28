"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  Company,
  COMPANY_TIER_LABELS,
  AXIS_MATCH_LABELS,
  VISION_FIT_LABELS,
  PassScoreBreakdown,
} from "@/types";

type Props = {
  company: Company;
  profile?: {
    university?: string;
    faculty?: string;
    graduationYear?: number;
    careerAxis?: string;
    gakuchika?: string;
    selfPr?: string;
    strengths?: string;
    weaknesses?: string;
    targetIndustries?: string[];
    targetJobs?: string[];
  };
  onUpdate: (patch: Partial<Company>) => Promise<void>;
};

type ScoreResult = {
  passScore: number;
  passScoreBreakdown: PassScoreBreakdown;
  passScoreNote?: string;
  tier?: Company["tier"];
  axisMatch?: Company["axis_match"];
  visionFit5y?: Company["vision_fit_5y"];
  visionFit5yNote?: string;
  visionFit10y?: Company["vision_fit_10y"];
  visionFit10yNote?: string;
  tagline?: string;
  positioning?: string;
  strengths?: string[];
  whyForMe?: string[];
  concerns?: string[];
  recommendedRoles?: string[];
};

function scoreZoneLabel(score: number): { emoji: string; label: string; color: string; bg: string } {
  if (score >= 80) return { emoji: "🟢", label: "射程圏", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 65) return { emoji: "🔵", label: "努力圏", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
  if (score >= 50) return { emoji: "🟡", label: "挑戦圏", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
  if (score >= 35) return { emoji: "🟠", label: "超リーチ", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
  return { emoji: "🔴", label: "撤退検討", color: "text-red-700", bg: "bg-red-50 border-red-200" };
}

const PASS_SCORE_AXIS = [
  { key: "gakureki", label: "学歴", max: 20 },
  { key: "gakuchika", label: "ガクチカ", max: 25 },
  { key: "axis", label: "軸", max: 20 },
  { key: "competition", label: "競争", max: 15 },
  { key: "english", label: "英語", max: 10 },
  { key: "special", label: "特殊", max: 10 },
] as const;

export function CompanyEvaluationCard({ company, profile, onUpdate }: Props) {
  const [scoring, setScoring] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { showToast } = useToast();

  const hasEvaluation = company.pass_score != null || company.axis_match != null || company.tier != null;
  const score = company.pass_score;
  const zone = score != null ? scoreZoneLabel(score) : null;

  const runScoring = async () => {
    setScoring(true);
    try {
      const res = await fetch("/api/ai/company-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          company: {
            name: company.name,
            industry: company.industry,
            status: company.status,
            notes: company.notes,
            deadline: company.deadline,
            whyForMe: company.why_for_me,
            concerns: company.concerns,
          },
        }),
      });
      if (res.status === 402) {
        const body = await res.json();
        showToast(body.error ?? "AI使用回数の上限に達しました", "error");
        return;
      }
      if (!res.ok) {
        showToast("採点に失敗しました", "error");
        return;
      }
      const data: ScoreResult = await res.json();
      await onUpdate({
        pass_score: data.passScore,
        pass_score_breakdown: data.passScoreBreakdown,
        pass_score_note: data.passScoreNote,
        tier: data.tier,
        axis_match: data.axisMatch,
        vision_fit_5y: data.visionFit5y,
        vision_fit_5y_note: data.visionFit5yNote,
        vision_fit_10y: data.visionFit10y,
        vision_fit_10y_note: data.visionFit10yNote,
        tagline: data.tagline,
        positioning: data.positioning,
        strengths: data.strengths,
        why_for_me: data.whyForMe,
        concerns: data.concerns,
        recommended_roles: data.recommendedRoles,
      });
      showToast(`採点完了：${data.passScore}点`, "success");
    } catch {
      showToast("採点中にエラーが発生しました", "error");
    } finally {
      setScoring(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600">📊</span>
              戦略評価
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              合格可能性スコア・軸合致度・5/10年ビジョン適合度をAIで採点
            </p>
          </div>
          <button
            type="button"
            onClick={runScoring}
            disabled={scoring}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg whitespace-nowrap"
          >
            {scoring ? "採点中…" : hasEvaluation ? "AIで再採点" : "AIで採点"}
          </button>
        </div>

        {!hasEvaluation && !scoring && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
            まだ採点されていません。「AIで採点」を押すと、自分のプロフィールと照らして100点満点で評価します。
          </div>
        )}

        {hasEvaluation && (
          <div className="space-y-5">
            {/* スコア表示 */}
            {score != null && zone && (
              <div className={`rounded-xl border ${zone.bg} p-4`}>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <div>
                    <span className={`text-5xl font-bold ${zone.color}`}>{score}</span>
                    <span className={`text-lg font-semibold ${zone.color} ml-1`}>/ 100</span>
                  </div>
                  <div className={`text-sm font-bold ${zone.color}`}>
                    {zone.emoji} {zone.label}
                  </div>
                </div>
                {company.pass_score_note && (
                  <p className="text-xs text-gray-700 mt-2 leading-relaxed">{company.pass_score_note}</p>
                )}
                {company.pass_score_breakdown && (
                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
                  >
                    {showBreakdown ? "内訳を隠す" : "採点内訳を表示"}
                  </button>
                )}
                {showBreakdown && company.pass_score_breakdown && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PASS_SCORE_AXIS.map((a) => {
                      const v = company.pass_score_breakdown![a.key] ?? 0;
                      const ratio = (v / a.max) * 100;
                      return (
                        <div key={a.key} className="bg-white/70 rounded p-2">
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-gray-600">{a.label}</span>
                            <span className="font-bold text-gray-900">
                              {v}<span className="text-gray-400">/{a.max}</span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${ratio}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* バッジ群 */}
            <div className="flex flex-wrap gap-2">
              {company.tier && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700">
                  {COMPANY_TIER_LABELS[company.tier].emoji} {COMPANY_TIER_LABELS[company.tier].label}
                </span>
              )}
              {company.axis_match && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full text-xs font-bold text-amber-700">
                  {AXIS_MATCH_LABELS[company.axis_match].emoji} 軸 {AXIS_MATCH_LABELS[company.axis_match].label}
                </span>
              )}
              {company.priority && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 rounded-full text-xs font-bold text-indigo-700">
                  優先 {company.priority}
                </span>
              )}
            </div>

            {/* tagline / positioning */}
            {(company.tagline || company.positioning) && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                {company.tagline && <p className="text-sm font-medium text-gray-900">💡 {company.tagline}</p>}
                {company.positioning && <p className="text-xs text-gray-600 mt-1">📍 {company.positioning}</p>}
              </div>
            )}

            {/* ビジョン適合度 */}
            {(company.vision_fit_5y || company.vision_fit_10y) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {company.vision_fit_5y && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-900">5年後ビジョン適合</span>
                      <span className="text-lg font-bold text-blue-700">
                        {VISION_FIT_LABELS[company.vision_fit_5y].emoji}
                      </span>
                    </div>
                    <p className="text-xs text-blue-900 font-medium">
                      {VISION_FIT_LABELS[company.vision_fit_5y].label}
                    </p>
                    {company.vision_fit_5y_note && (
                      <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">{company.vision_fit_5y_note}</p>
                    )}
                  </div>
                )}
                {company.vision_fit_10y && (
                  <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-purple-900">10年後ビジョン適合</span>
                      <span className="text-lg font-bold text-purple-700">
                        {VISION_FIT_LABELS[company.vision_fit_10y].emoji}
                      </span>
                    </div>
                    <p className="text-xs text-purple-900 font-medium">
                      {VISION_FIT_LABELS[company.vision_fit_10y].label}
                    </p>
                    {company.vision_fit_10y_note && (
                      <p className="text-[11px] text-purple-800 mt-1 leading-relaxed">{company.vision_fit_10y_note}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 自分視点メモ */}
            {(company.why_for_me?.length || company.concerns?.length || company.strengths?.length) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {company.strengths?.length ? (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                    <h3 className="text-xs font-bold text-emerald-900 mb-1.5">企業の強み</h3>
                    <ul className="text-xs text-emerald-900 space-y-1 list-disc pl-4">
                      {company.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                ) : null}
                {company.why_for_me?.length ? (
                  <div className="rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                    <h3 className="text-xs font-bold text-rose-900 mb-1.5">なぜ自分に合うか</h3>
                    <ul className="text-xs text-rose-900 space-y-1 list-disc pl-4">
                      {company.why_for_me.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                ) : null}
                {company.concerns?.length ? (
                  <div className="rounded-lg border border-orange-100 bg-orange-50/60 p-3">
                    <h3 className="text-xs font-bold text-orange-900 mb-1.5">懸念点</h3>
                    <ul className="text-xs text-orange-900 space-y-1 list-disc pl-4">
                      {company.concerns.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {/* おすすめ職種 */}
            {company.recommended_roles?.length ? (
              <div>
                <h3 className="text-xs font-bold text-gray-700 mb-1.5">🎯 おすすめ職種・コース</h3>
                <div className="flex flex-wrap gap-1.5">
                  {company.recommended_roles.map((r, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
