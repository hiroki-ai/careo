"use client";

import { useRef, useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useObVisits } from "@/hooks/useObVisits";
import { useAptitudeTests } from "@/hooks/useAptitudeTests";
import { COMPANY_STATUS_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";

interface Message {
  id: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}

export default function CareerCenterPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const markRead = (id: string) => {
    fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: true } : m));
  };
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { visits } = useObVisits();
  const { tests } = useAptitudeTests();
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  const activeCompanies = companies.filter(c => !["WISHLIST", "OFFERED", "REJECTED"].includes(c.status));
  const offeredCompanies = companies.filter(c => c.status === "OFFERED");
  const submittedEs = esList.filter(e => e.status === "SUBMITTED");
  const passedInterviews = interviews.filter(i => i.result === "PASS");

  if (profileLoading) {
    return <div className="p-8 text-gray-400 text-sm">読み込み中...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">キャリアセンター</h1>
        <p className="text-sm text-gray-400 mt-0.5">メッセージ確認・就活レポートの印刷・提出</p>
      </div>

      {/* キャリアセンターからのメッセージ */}
      {messages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            📬 キャリアセンターからのメッセージ
            {messages.some((m) => !m.isRead) && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {messages.filter((m) => !m.isRead).length}
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border p-4 ${msg.isRead ? "bg-white border-gray-100" : "bg-blue-50 border-blue-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{msg.body}</p>
                  {!msg.isRead && (
                    <button
                      type="button"
                      onClick={() => markRead(msg.id)}
                      className="shrink-0 text-xs text-blue-600 hover:underline"
                    >
                      既読にする
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  {new Date(msg.sentAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
          <div className="flex items-center justify-between mb-6 print:hidden">
            <p className="text-sm font-semibold text-gray-700">就活レポート（印刷・提出用）</p>
            <p className="text-sm text-gray-500">{today}時点</p>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              🖨️ 印刷・PDF保存
            </button>
          </div>

          <div ref={printRef}>
            <div className="hidden print:block mb-6 pb-4 border-b border-gray-300">
              <h1 className="text-2xl font-bold">就活進捗レポート</h1>
              <p className="text-sm text-gray-600">{today}時点 · Careo (careo-sigma.vercel.app)</p>
            </div>

            <section className="mb-6 bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">基本情報・自己分析</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">大学・学部</p>
                  <p className="text-sm font-medium">{profile?.university} {profile?.faculty} {profile?.grade}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">卒業予定</p>
                  <p className="text-sm font-medium">{profile?.graduationYear}年3月</p>
                </div>
              </div>
              {profile?.careerAxis && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">就活の軸</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.careerAxis}</p>
                </div>
              )}
              {profile?.selfPr && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">自己PR（抜粋）</p>
                  <p className="text-sm text-gray-700">{profile.selfPr.substring(0, 200)}{profile.selfPr.length > 200 && "…"}</p>
                </div>
              )}
              {profile?.strengths && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">強み</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.strengths}</p>
                </div>
              )}
            </section>

            <section className="mb-6 bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">選考活動サマリー</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: "応募・選考企業", value: activeCompanies.length + offeredCompanies.length, unit: "社" },
                  { label: "ES提出", value: submittedEs.length, unit: "件" },
                  { label: "面接経験", value: interviews.length, unit: "回" },
                  { label: "内定", value: offeredCompanies.length, unit: "社" },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{item.value}<span className="text-sm font-normal text-gray-500">{item.unit}</span></p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">応募企業一覧</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[400px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 text-gray-500 font-medium">企業名</th>
                        <th className="text-left py-1.5 text-gray-500 font-medium">業界</th>
                        <th className="text-left py-1.5 text-gray-500 font-medium">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {companies.filter(c => c.status !== "WISHLIST")
                        .sort((a, b) => (a.status === "OFFERED" ? -1 : b.status === "OFFERED" ? 1 : 0))
                        .map(c => (
                          <tr key={c.id}>
                            <td className="py-1.5 font-medium text-gray-800">{c.name}</td>
                            <td className="py-1.5 text-gray-500">{c.industry ?? "-"}</td>
                            <td className="py-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                c.status === "OFFERED" ? "bg-green-100 text-green-700" :
                                c.status === "REJECTED" ? "bg-red-100 text-red-600" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {COMPANY_STATUS_LABELS[c.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {interviews.length > 0 && (
              <section className="mb-6 bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">面接実績</h3>
                <div className="flex gap-6 mb-4">
                  <div className="text-center"><p className="text-2xl font-bold">{interviews.length}</p><p className="text-xs text-gray-500">総面接数</p></div>
                  <div className="text-center"><p className="text-2xl font-bold text-emerald-600">{passedInterviews.length}</p><p className="text-xs text-gray-500">通過</p></div>
                  <div className="text-center"><p className="text-2xl font-bold">{interviews.length > 0 ? Math.round((passedInterviews.length / interviews.length) * 100) : 0}%</p><p className="text-xs text-gray-500">通過率</p></div>
                </div>
                <div className="space-y-1">
                  {interviews.slice(0, 10).map(i => {
                    const c = companies.find(co => co.id === i.companyId);
                    return (
                      <div key={i.id} className="flex items-center justify-between py-1 border-b border-gray-50 text-xs">
                        <span className="text-gray-800 font-medium">{c?.name ?? "不明"} — {i.round}次面接</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{i.scheduledAt ? formatDate(i.scheduledAt) : "-"}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${i.result === "PASS" ? "bg-green-100 text-green-700" : i.result === "FAIL" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                            {i.result === "PASS" ? "通過" : i.result === "FAIL" ? "不合格" : "結果待ち"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {visits.length > 0 && (
              <section className="mb-6 bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">OB/OG訪問 ({visits.length}件)</h3>
                <div className="space-y-2">
                  {visits.map(v => (
                    <div key={v.id} className="flex items-start justify-between text-xs border-b border-gray-50 pb-2">
                      <div>
                        <p className="font-medium text-gray-800">{v.companyName}</p>
                        <p className="text-gray-500 mt-0.5">{v.purpose}</p>
                      </div>
                      <span className="text-gray-400 shrink-0 ml-4">{v.visitedAt ? formatDate(v.visitedAt) : "-"}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tests.length > 0 && (
              <section className="mb-6 bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">筆記試験記録</h3>
                <div className="space-y-2">
                  {tests.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2">
                      <div>
                        <p className="font-medium text-gray-800">{t.companyName} — {t.testType}</p>
                        {t.scoreVerbal && <p className="text-gray-500 mt-0.5">言語: {t.scoreVerbal} / 非言語: {t.scoreNonverbal}</p>}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${t.result === "PASS" ? "bg-green-100 text-green-700" : t.result === "FAIL" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                        {t.result === "PASS" ? "通過" : t.result === "FAIL" ? "不通過" : "結果待ち"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
              Careo — AI就活コーチアプリ · careo-sigma.vercel.app
            </div>
          </div>
        </div>

      <style>{`
        @media print {
          body { font-size: 12px; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
