"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
  userId: string;
  university: string;
  faculty: string;
  grade: string;
  graduationYear: number;
  jobSearchStage: string;
  targetIndustries: string[];
  careerCenterVisibility: Record<string, boolean>;
  companiesCount: number;
  offeredCount: number;
  interviewCount: number;
  obVisitCount: number;
  createdAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  not_started: "未着手",
  just_started: "始めたばかり",
  in_progress: "本格活動中",
};

const STAGE_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-500",
  just_started: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-green-100 text-green-700",
};

function PrivacyMasked() {
  return <span className="text-gray-300 text-xs">非公開</span>;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradFilter, setGradFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/career-portal/students")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .finally(() => setLoading(false));
  }, []);

  const gradYears = [...new Set(students.map((s) => s.graduationYear))].sort();

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.faculty.includes(search) ||
      s.grade.includes(search) ||
      s.targetIndustries.some((i) => i.includes(search));
    const matchGrad = gradFilter === "all" || s.graduationYear === Number(gradFilter);
    const matchStage = stageFilter === "all" || s.jobSearchStage === stageFilter;
    return matchSearch && matchGrad && matchStage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">学生一覧</h1>
        <p className="text-sm text-gray-500 mt-1">{students.length}名が登録中</p>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="学部・業界で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={gradFilter}
          onChange={(e) => setGradFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">全卒業年度</option>
          {gradYears.map((y) => (
            <option key={y} value={y}>{y}卒</option>
          ))}
        </select>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">全ステージ</option>
          {Object.entries(STAGE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">学部・学年</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">卒業</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ステージ</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">企業</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">内定</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">面接</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">OB訪問</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                  該当する学生が見つかりません
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.userId} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{s.faculty}</div>
                    <div className="text-xs text-gray-400">{s.grade}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.graduationYear}卒</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[s.jobSearchStage] ?? "bg-gray-100 text-gray-500"}`}>
                      {STAGE_LABELS[s.jobSearchStage] ?? s.jobSearchStage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {s.companiesCount === -1 ? <PrivacyMasked /> : `${s.companiesCount}社`}
                  </td>
                  <td className="px-4 py-3">
                    {s.offeredCount === -1 ? (
                      <PrivacyMasked />
                    ) : s.offeredCount > 0 ? (
                      <span className="text-green-600 font-semibold">{s.offeredCount}社</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {s.interviewCount === -1 ? <PrivacyMasked /> : `${s.interviewCount}回`}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {s.obVisitCount === -1 ? <PrivacyMasked /> : `${s.obVisitCount}件`}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/career-portal/students/${s.userId}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      詳細 →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
