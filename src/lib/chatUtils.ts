/**
 * カレオの返答から [追加候補: 企業名1, 企業名2] タグを解析する
 */
export function parseCompanySuggestions(text: string): { display: string; companies: string[] } {
  const match = text.match(/\[追加候補:\s*([^\]]+)\]/);
  if (!match) return { display: text, companies: [] };

  const companies = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const display = text.replace(/\n?\[追加候補:[^\]]*\]/, "").trimEnd();

  return { display, companies };
}

/**
 * 自己分析フィールドの型と定数
 */
export type SelfAnalysisField = "careerAxis" | "gakuchika" | "selfPr" | "strengths" | "weaknesses";

export const SELF_ANALYSIS_LABELS: Record<SelfAnalysisField, string> = {
  careerAxis: "就活の軸",
  gakuchika: "ガクチカ",
  selfPr: "自己PR",
  strengths: "強み",
  weaknesses: "弱み",
};

export interface SelfAnalysisSuggestion {
  field: SelfAnalysisField;
  content: string;
}

const VALID_FIELDS: SelfAnalysisField[] = ["careerAxis", "gakuchika", "selfPr", "strengths", "weaknesses"];

/**
 * カレオの返答から [自己分析: field | content] タグを解析して返す
 */
export function parseSelfAnalysis(text: string): { display: string; suggestions: SelfAnalysisSuggestion[] } {
  const regex = /\[自己分析:\s*(\w+)\s*\|\s*([^\]]+)\]/g;
  const suggestions: SelfAnalysisSuggestion[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const field = match[1] as SelfAnalysisField;
    if (VALID_FIELDS.includes(field)) {
      suggestions.push({ field, content: match[2].trim() });
    }
  }
  const display = text.replace(/\n?\[自己分析:\s*\w+\s*\|[^\]]+\]/g, "").trim();
  return { display, suggestions };
}
