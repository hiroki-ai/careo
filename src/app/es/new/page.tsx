"use client";

import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { EsForm } from "@/components/es/EsForm";
import { ES_TEMPLATES, templateToQuestions, type EsTemplate } from "@/data/esTemplates";
import { QAPair } from "@/types";

function TemplateStep({ onSelect, onSkip }: { onSelect: (questions: QAPair[]) => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<EsTemplate | null>(null);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">テンプレートから始める</h2>
      <p className="text-sm text-gray-500 mb-5">業界に合ったES設問構成を選ぶと入力がスムーズになります</p>

      <div className="grid gap-3 mb-6">
        {ES_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => setSelected(selected?.id === tmpl.id ? null : tmpl)}
            className={`text-left w-full rounded-xl border p-4 transition-all ${
              selected?.id === tmpl.id
                ? "border-[#00c896] bg-[#00c896]/5 ring-1 ring-[#00c896]"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{tmpl.label}</span>
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tmpl.industry}</span>
                </div>
                <p className="text-xs text-gray-500">{tmpl.description}</p>
              </div>
              {selected?.id === tmpl.id && (
                <span className="text-[#00c896] font-bold text-lg shrink-0 ml-2">✓</span>
              )}
            </div>
            {selected?.id === tmpl.id && (
              <div className="mt-3 pt-3 border-t border-[#00c896]/20">
                <p className="text-xs font-medium text-gray-600 mb-2">含まれる設問（{tmpl.questions.length}問）</p>
                <ol className="space-y-1">
                  {tmpl.questions.map((q, i) => (
                    <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                      <span className="shrink-0 text-[#00c896] font-bold">{i + 1}.</span>
                      {q.question}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          テンプレートを使わない
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onSelect(templateToQuestions(selected))}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#00c896] text-white hover:bg-[#00b586] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          このテンプレートで作成
        </button>
      </div>
    </div>
  );
}

function NewEsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId") ?? "";
  const { addEs } = useEs();
  const { companies } = useCompanies();
  const [step, setStep] = useState<"template" | "form">("template");
  const [initialQuestions, setInitialQuestions] = useState<QAPair[] | undefined>(undefined);

  const handleTemplateSelect = (questions: QAPair[]) => {
    setInitialQuestions(questions);
    setStep("form");
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/es" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← ES一覧
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ESを追加</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {step === "template" ? (
          <TemplateStep
            onSelect={handleTemplateSelect}
            onSkip={() => setStep("form")}
          />
        ) : (
          <>
            {initialQuestions && (
              <button
                type="button"
                onClick={() => setStep("template")}
                className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
              >
                ← テンプレート選択に戻る
              </button>
            )}
            <EsForm
              companies={companies}
              initialCompanyId={companyId}
              initialData={initialQuestions ? { questions: initialQuestions } : undefined}
              onSubmit={async (data) => {
                const es = await addEs(data);
                router.push(`/es/${es.id}`);
              }}
              onCancel={() => router.back()}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function NewEsPage() {
  return (
    <Suspense fallback={<div className="p-8">読み込み中...</div>}>
      <NewEsContent />
    </Suspense>
  );
}
