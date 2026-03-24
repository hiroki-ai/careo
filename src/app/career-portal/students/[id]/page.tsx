"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { COMPANY_STATUS_LABELS, COMPANY_STATUS_COLORS } from "@/types";

interface StudentDetail {
  userId: string;
  university: string;
  faculty: string;
  grade: string;
  graduationYear: number;
  jobSearchStage: string;
  targetIndustries: string[] | null;
  targetJobs: string[] | null;
  careerCenterVisibility: Record<string, boolean>;
  careerAxis: string | null;
  selfPr: string | null;
  strengths: string | null;
  weaknesses: string | null;
  companies: { id: string; name: string; industry: string; status: string }[] | null;
  companiesCount: number;
  offeredCount: number;
  obVisits: { id: string; companyName: string; visitedAt: string; purpose: string; impression?: string }[] | null;
  obVisitCount: number;
  aptitudeTests: { id: string; companyName: string; testType: string; result: string; scoreVerbal?: number; scoreNonverbal?: number }[] | null;
  createdAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  not_started: "まだ始めていない",
  just_started: "始めたばかり",
  in_progress: "本格的に進めている",
};

const PURPOSE_LABELS: Record<string, string> = {
  ob_visit: "OB/OG訪問",
  info_session: "会社説明会",
  internship: "インターン",
};

const IMPRESSION_LABELS: Record<string, string> = {
  positive: "好印象",
  neutral: "普通",
  negative: "懸念あり",
};

const IMPRESSION_COLORS: Record<string, string> = {
  positive: "text-green-600",
  neutral: "text-gray-500",
  negative: "text-red-500",
};

function PrivacyBadge() {
  return (
    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">非公開</span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/career-portal/students/${id}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        const d = await r.json();
        setStudent(d.student);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">学生が見つかりません</p>
        <Link href="/career-portal/students" className="text-blue-600 hover:underline text-sm">
          ← 学生一覧に戻る
        </Link>
      </div>
    );
  }

  const vis = student.careerCenterVisibility;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/career-portal/students" className="hover:text-blue-600 transition-colors">学生一覧</Link>
        <span>/</span>
        <span className="text-gray-700">{student.faculty} {student.grade}</span>
      </div>

      {/* プロフィールヘッダー */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {student.faculty} · {student.grade}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{student.university} / {student.graduationYear}卒</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                {STAGE_LABELS[student.jobSearchStage] ?? student.jobSearchStage}
              </span>
              {student.offeredCount > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  内定 {student.offeredCount}社
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-gray-400 shrink-0">
            <p>登録: {new Date(student.createdAt).toLocaleDateString("ja-JP")}</p>
          </div>
        </div>
      </div>

      {/* 志望 */}
      <SectionCard title="志望業界・職種">
        {vis.targetIndustriesJobs === false ? (
          <PrivacyBadge />
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1.5">志望業界</p>
              <div className="flex flex-wrap gap-1.5">
                {(student.targetIndustries ?? []).length === 0 ? (
                  <span className="text-sm text-gray-400">未設定</span>
                ) : (
                  student.targetIndustries!.map((ind) => (
                    <span key={ind} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{ind}</span>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">志望職種</p>
              <div className="flex flex-wrap gap-1.5">
                {(student.targetJobs ?? []).length === 0 ? (
                  <span className="text-sm text-gray-400">未設定</span>
                ) : (
                  student.targetJobs!.map((job) => (
                    <span key={job} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{job}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 自己分析 */}
      <SectionCard title="自己分析">
        {vis.esSelfAnalysis === false ? (
          <PrivacyBadge />
        ) : (
          <div className="space-y-3 text-sm">
            {[
              { label: "キャリア軸", value: student.careerAxis },
              { label: "自己PR", value: student.selfPr },
              { label: "強み", value: student.strengths },
              { label: "弱み", value: student.weaknesses },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm leading-relaxed">
                  {value || <span className="text-gray-300">未入力</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 選考企業 */}
      <SectionCard title={`選考企業（${student.companiesCount === -1 ? "非公開" : `${student.companiesCount}社`}）`}>
        {vis.companies === false || student.companies === null ? (
          <PrivacyBadge />
        ) : student.companies.length === 0 ? (
          <p className="text-sm text-gray-400">登録なし</p>
        ) : (
          <div className="space-y-1.5">
            {student.companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-800">{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{c.industry}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMPANY_STATUS_COLORS[c.status as keyof typeof COMPANY_STATUS_COLORS] ?? "bg-gray-100 text-gray-600"}`}>
                  {COMPANY_STATUS_LABELS[c.status as keyof typeof COMPANY_STATUS_LABELS] ?? c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* OB/OG訪問 */}
      <SectionCard title={`OB/OG訪問（${student.obVisitCount === -1 ? "非公開" : `${student.obVisitCount}件`}）`}>
        {vis.obVisits === false || student.obVisits === null ? (
          <PrivacyBadge />
        ) : student.obVisits.length === 0 ? (
          <p className="text-sm text-gray-400">記録なし</p>
        ) : (
          <div className="space-y-2">
            {student.obVisits.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-800">{o.companyName}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {PURPOSE_LABELS[o.purpose] ?? o.purpose}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                  {o.impression && (
                    <span className={IMPRESSION_COLORS[o.impression] ?? "text-gray-400"}>
                      {IMPRESSION_LABELS[o.impression] ?? o.impression}
                    </span>
                  )}
                  <span>{new Date(o.visitedAt).toLocaleDateString("ja-JP")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 筆記試験 */}
      <SectionCard title="筆記試験">
        {vis.aptitudeTests === false || student.aptitudeTests === null ? (
          <PrivacyBadge />
        ) : student.aptitudeTests.length === 0 ? (
          <p className="text-sm text-gray-400">記録なし</p>
        ) : (
          <div className="space-y-2">
            {student.aptitudeTests.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-800">{t.companyName}</span>
                  <span className="text-xs text-gray-400 ml-2">{t.testType}</span>
                </div>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  {t.scoreVerbal != null && (
                    <span className="text-gray-500">言語 {t.scoreVerbal}</span>
                  )}
                  {t.scoreNonverbal != null && (
                    <span className="text-gray-500">非言語 {t.scoreNonverbal}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    t.result === "PASS" ? "bg-green-100 text-green-700" :
                    t.result === "FAIL" ? "bg-red-100 text-red-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {t.result === "PASS" ? "通過" : t.result === "FAIL" ? "不通過" : "審査中"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
