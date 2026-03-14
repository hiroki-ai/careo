"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { useProfile } from "@/hooks/useProfile";
import { EsForm } from "@/components/es/EsForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { QAPair } from "@/types";

interface AiGenResult {
  answer: string;
  advice: string;
  keywords: string[];
}

function EsQuestionCard({
  qa,
  index,
  companyName,
  companyIndustry,
  profile,
  otherAnswers,
  onUseAnswer,
}: {
  qa: QAPair;
  index: number;
  companyName: string;
  companyIndustry?: string;
  profile: ReturnType<typeof useProfile>["profile"];
  otherAnswers: { question: string; answer: string }[];
  onUseAnswer: (questionId: string, answer: string) => void;
}) {
  const [aiResult, setAiResult] = useState<AiGenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setShowAi(true);
    try {
      const res = await fetch("/api/ai/es-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: qa.question,
          companyName,
          companyIndustry,
          careerAxis: profile?.careerAxis,
          gakuchika: profile?.gakuchika,
          selfPr: profile?.selfPr,
          strengths: profile?.strengths,
          otherAnswers,
        }),
      });
      const data = await res.json();
      if (!data.error) setAiResult(data);
    } catch (err) {
      console.error("[es-generate]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">設問 {index + 1}</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">{qa.question || "(設問未入力)"}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={loading || !qa.question}
        >
          {loading ? "生成中..." : showAi && aiResult ? "再生成" : "✨ AI生成"}
        </Button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-2">
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {qa.answer || "(回答未入力)"}
        </p>
      </div>
      {qa.answer && (
        <p className="text-xs text-gray-400 text-right mb-3">{qa.answer.length}字</p>
      )}

      {/* AI生成結果パネル */}
      {showAi && (
        <div className="mt-3 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">✨ AI生成回答</span>
            <button
              onClick={() => setShowAi(false)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              閉じる
            </button>
          </div>

          {loading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 bg-blue-100 rounded animate-pulse" />
              ))}
            </div>
          )}

          {!loading && aiResult && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-blue-100 dark:border-blue-800">
                {aiResult.answer}
              </div>
              <p className="text-xs text-blue-600 text-right mb-3">{aiResult.answer.length}字</p>

              {aiResult.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {aiResult.keywords.map((kw, i) => (
                    <span key={i} className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {aiResult.advice && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-3 border border-amber-100 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">アドバイス</p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiResult.advice}</p>
                </div>
              )}

              <Button
                size="sm"
                onClick={() => onUseAnswer(qa.id, aiResult.answer)}
                className="w-full"
              >
                この回答を使う
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function EsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { esList, updateEs, deleteEs } = useEs();
  const { companies } = useCompanies();
  const { profile } = useProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

  const es = esList.find((e) => e.id === id);
  const company = es ? companies.find((c) => c.id === es.companyId) : null;

  if (!es) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">ESが見つかりません</p>
        <Link href="/es" className="text-blue-600 text-sm mt-2 inline-block">← ES一覧に戻る</Link>
      </div>
    );
  }

  const handleUseAnswer = (questionId: string, answer: string) => {
    const updatedQuestions = es.questions.map((q) =>
      q.id === questionId ? { ...q, answer } : q
    );
    updateEs(id, { questions: updatedQuestions });
  };

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/es" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">← ES一覧</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          {company && (
            <Link href={`/companies/${company.id}`} className="text-sm text-blue-500 hover:underline mb-1 inline-block">
              {company.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{es.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={es.status === "SUBMITTED" ? "success" : "warning"}>
              {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
            </Badge>
            {es.deadline && (
              <span className="text-sm text-gray-500">締切: {formatDate(es.deadline)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>編集</Button>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteConfirm(true)}>削除</Button>
        </div>
      </div>

      {!profile?.gakuchika && !profile?.selfPr && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <p className="text-sm text-amber-800">
            💡 <Link href="/career" className="font-semibold underline">自己分析</Link>を登録するとAI生成の精度が大幅に上がります
          </p>
        </div>
      )}

      {/* 設問・回答 */}
      <div className="space-y-4">
        {es.questions.map((q, i) => (
          <EsQuestionCard
            key={q.id}
            qa={q}
            index={i}
            companyName={company?.name ?? ""}
            companyIndustry={company?.industry}
            profile={profile}
            otherAnswers={es.questions
              .filter((other) => other.id !== q.id && other.answer)
              .map((other) => ({ question: other.question, answer: other.answer }))}
            onUseAnswer={handleUseAnswer}
          />
        ))}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="ESを編集" size="lg">
        <EsForm
          companies={companies}
          initialData={es}
          onSubmit={(data) => {
            updateEs(id, data);
            setIsEditOpen(false);
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <Modal isOpen={isDeleteConfirm} onClose={() => setIsDeleteConfirm(false)} title="ESを削除" size="sm">
        <p className="text-sm text-gray-600 mb-6">「{es.title}」を削除しますか？</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteConfirm(false)}>キャンセル</Button>
          <Button variant="danger" onClick={() => { deleteEs(id); router.push("/es"); }}>削除する</Button>
        </div>
      </Modal>
    </div>
  );
}
