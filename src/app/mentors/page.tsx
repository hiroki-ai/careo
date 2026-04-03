"use client";

import { useState, useMemo } from "react";
import { MENTORS, MENTOR_INDUSTRIES, MENTOR_UNIVERSITIES, CONTACT_METHOD_LABELS, type Mentor } from "@/data/mentors";
import { INDUSTRIES } from "@/types";

const CONTACT_ICONS: Record<Mentor["contactMethod"], string> = {
  line: "💬",
  twitter: "𝕏",
  email: "📧",
  marshmallow: "🍡",
};

function MentorCard({ mentor }: { mentor: Mentor }) {
  const [showContact, setShowContact] = useState(false);

  const contactHref = (() => {
    switch (mentor.contactMethod) {
      case "twitter": return `https://twitter.com/${mentor.contactInfo.replace("@", "")}`;
      case "email": return `mailto:${mentor.contactInfo}`;
      case "marshmallow": return mentor.contactInfo;
      default: return null;
    }
  })();

  return (
    <div className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-md ${!mentor.available ? "opacity-60" : "border-gray-100"}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{mentor.name}</h3>
            {!mentor.available && (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">現在受付停止中</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {mentor.university}・{mentor.faculty}（{mentor.gradYear}年卒）
          </p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-xs font-semibold text-gray-800">{mentor.company}</p>
          <p className="text-[11px] text-gray-500">{mentor.jobType}</p>
        </div>
      </div>

      {/* 業界タグ */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{mentor.industry}</span>
        {mentor.tags.map((tag) => (
          <span key={tag} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>

      {/* 一言紹介 */}
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{mentor.bio}</p>

      {/* 連絡先 */}
      {mentor.available && (
        <div>
          {!showContact ? (
            <button
              onClick={() => setShowContact(true)}
              className="w-full py-2 rounded-lg text-sm font-medium bg-[#00c896] text-white hover:bg-[#00b586] transition-colors active:scale-95"
            >
              連絡先を表示する
            </button>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1.5">
                {CONTACT_ICONS[mentor.contactMethod]} {CONTACT_METHOD_LABELS[mentor.contactMethod]}
              </p>
              {contactHref ? (
                <a
                  href={contactHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline break-all"
                >
                  {mentor.contactInfo}
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-800 break-all">ID: {mentor.contactInfo}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-2">
                ※ 訪問依頼の際は「Careo経由でOB/OG訪問をお願いしたい」と一言添えてください
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MentorsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>("すべて");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("すべて");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return MENTORS.filter((m) => {
      if (selectedIndustry !== "すべて" && m.industry !== selectedIndustry) return false;
      if (selectedUniversity !== "すべて" && m.university !== selectedUniversity) return false;
      if (showAvailableOnly && !m.available) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          m.name.includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.university.includes(q) ||
          m.industry.includes(q) ||
          m.bio.includes(q) ||
          m.tags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [selectedIndustry, selectedUniversity, showAvailableOnly, search]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">先輩に相談する</h1>
        <p className="text-sm text-gray-500 mt-1">
          業界・大学別に先輩OB/OGを探してOB訪問をリクエストできます（{MENTORS.filter(m => m.available).length}人受付中）
        </p>
      </div>

      {/* 注意書き */}
      <div className="mb-5 bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs text-amber-800 font-medium mb-1">ご利用にあたって</p>
        <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
          <li>連絡先を表示後、直接ご連絡ください。返信は保証されません。</li>
          <li>社会人の方への礼儀を忘れずに。日程・場所は相手の都合を最優先に。</li>
          <li>相談内容は社内機密に触れないよう注意してください。</li>
        </ul>
      </div>

      {/* フィルター */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6 space-y-3">
        {/* 検索 */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="企業名・大学・キーワードで検索..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />

        <div className="flex flex-wrap gap-3">
          {/* 業界フィルター */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">業界</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="すべて">すべての業界</option>
              {MENTOR_INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* 大学フィルター */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">大学</label>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="すべて">すべての大学</option>
              {MENTOR_UNIVERSITIES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 受付中のみ */}
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={(e) => setShowAvailableOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-[#00c896]"
          />
          <span className="text-sm text-gray-700">受付中の先輩のみ表示</span>
        </label>
      </div>

      {/* 件数 */}
      <p className="text-sm text-gray-500 mb-4">
        {filtered.length}件 / {MENTORS.length}人中
      </p>

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">条件に合う先輩が見つかりません</p>
          <p className="text-sm mt-1">フィルターを変えて試してみてください</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}

      {/* 掲載希望 */}
      <div className="mt-8 border-t border-gray-100 pt-6 text-center">
        <p className="text-sm text-gray-500 mb-2">先輩として掲載されたい方・情報更新の方</p>
        <a
          href="mailto:hello@careo.jp?subject=先輩メンター登録希望"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
        >
          📧 hello@careo.jp までご連絡ください
        </a>
      </div>
    </div>
  );
}
