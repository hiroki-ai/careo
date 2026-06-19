"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Company,
  COMPANY_STATUS_LABELS,
  COMPANY_TIER_LABELS,
  AXIS_MATCH_LABELS,
} from "@/types";

type SortKey =
  | "name"
  | "industry"
  | "status"
  | "deadline"
  | "pass_score"
  | "axis_match"
  | "tier"
  | "updated";
type SortDir = "asc" | "desc";

const STATUS_ORDER_RANK: Record<string, number> = {
  WISHLIST: 1,
  MYPAGE_REGISTERED: 2,
  DM_CONTACT: 3,
  CASUAL_MEETING: 3.5,
  REFERRAL: 3.7,
  INTERN_APPLYING: 4,
  INTERN_DOCUMENT: 5,
  INTERN_WEB_TEST: 5.5,
  INTERN_INTERVIEW_1: 6,
  INTERN_INTERVIEW_2: 6.5,
  INTERN_FINAL: 7,
  INTERN: 8,
  APPLIED: 4.5,
  DOCUMENT: 5.2,
  WEB_TEST: 5.7,
  INTERVIEW_1: 6.2,
  INTERVIEW_2: 6.7,
  INTERVIEW_3: 7.2,
  FINAL: 7.5,
  OFFERED: 10,
  REJECTED: -1,
  INTERNSHIP_REJECTED: -2,
  SUMMER_MISSED: -0.5,
  WITHDRAWN: -3,
};

const AXIS_RANK: Record<string, number> = {
  perfect: 4,
  strong: 3,
  neutral: 2,
  mismatch: 1,
};

const TIER_RANK: Record<string, number> = {
  safe: 3,
  effort: 2,
  challenge: 1,
};

function scoreColorClass(score?: number) {
  if (score == null) return "text-gray-400";
  if (score >= 80) return "text-emerald-700 font-bold";
  if (score >= 65) return "text-blue-700 font-bold";
  if (score >= 50) return "text-yellow-700 font-medium";
  if (score >= 35) return "text-orange-700";
  return "text-red-700";
}

export function CompanySheet({ companies }: { companies: Company[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir(
        key === "name" || key === "industry" ? "asc" : "desc"
      );
    }
  };

  const sorted = useMemo(() => {
    const list = [...companies];
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "ja") * dir;
        case "industry":
          return (a.industry ?? "").localeCompare(b.industry ?? "", "ja") * dir;
        case "status": {
          const ar = STATUS_ORDER_RANK[a.status] ?? 0;
          const br = STATUS_ORDER_RANK[b.status] ?? 0;
          return (ar - br) * dir;
        }
        case "deadline": {
          const av = a.deadline ?? "";
          const bv = b.deadline ?? "";
          if (!av && !bv) return 0;
          if (!av) return 1;
          if (!bv) return -1;
          return av.localeCompare(bv) * dir;
        }
        case "pass_score": {
          const av = a.pass_score ?? -1;
          const bv = b.pass_score ?? -1;
          return (av - bv) * dir;
        }
        case "axis_match": {
          const av = a.axis_match ? AXIS_RANK[a.axis_match] : 0;
          const bv = b.axis_match ? AXIS_RANK[b.axis_match] : 0;
          return (av - bv) * dir;
        }
        case "tier": {
          const av = a.tier ? TIER_RANK[a.tier] : 0;
          const bv = b.tier ? TIER_RANK[b.tier] : 0;
          return (av - bv) * dir;
        }
        case "updated":
        default:
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      }
    });
    return list;
  }, [companies, sortBy, sortDir]);

  const SortHeader = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" | "center" }) => {
    const active = sortBy === k;
    const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "";
    return (
      <th
        scope="col"
        className={`px-3 py-2 text-xs font-bold text-gray-600 select-none cursor-pointer hover:bg-gray-100 transition-colors text-${align} whitespace-nowrap`}
        onClick={() => toggleSort(k)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <span className={`text-[10px] ${active ? "text-emerald-600" : "text-gray-300"}`}>{arrow || "↕"}</span>
        </span>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
      <table className="w-full text-sm border-collapse min-w-[820px]">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader k="name" label="企業" />
            <SortHeader k="industry" label="業界" />
            <SortHeader k="status" label="ステータス" />
            <SortHeader k="deadline" label="締切" />
            <SortHeader k="pass_score" label="📊スコア" align="right" />
            <SortHeader k="axis_match" label="軸" align="center" />
            <SortHeader k="tier" label="3圏" align="center" />
            <SortHeader k="updated" label="更新" align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                該当する企業がありません
              </td>
            </tr>
          ) : (
            sorted.map((c) => {
              const score = c.pass_score;
              return (
                <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/companies/${c.id}`}
                      className="font-medium text-gray-900 hover:text-emerald-700 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{c.industry ?? "-"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-700">
                      {COMPANY_STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                    {c.deadline ?? <span className="text-gray-300">-</span>}
                  </td>
                  <td className={`px-3 py-2.5 text-right whitespace-nowrap ${scoreColorClass(score)}`}>
                    {score != null ? `${score}` : <span className="text-gray-300 font-normal">-</span>}
                    {score != null && <span className="text-[10px] text-gray-400 font-normal">/100</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center" title={c.axis_match ? AXIS_MATCH_LABELS[c.axis_match].label : ""}>
                    {c.axis_match ? AXIS_MATCH_LABELS[c.axis_match].emoji : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center" title={c.tier ? COMPANY_TIER_LABELS[c.tier].label : ""}>
                    {c.tier ? COMPANY_TIER_LABELS[c.tier].emoji : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[11px] text-gray-400 whitespace-nowrap">
                    {new Date(c.updatedAt).toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" })}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-400 px-3 py-2 border-t border-gray-100">
        💡 列ヘッダー（企業・業界・ステータス・締切・スコア・軸・3圏・更新）をクリックで並び替え
      </p>
    </div>
  );
}
