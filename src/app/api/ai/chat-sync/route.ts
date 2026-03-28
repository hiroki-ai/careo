import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// チャットから抽出できる自己分析フィールド
type SelfAnalysisField = "careerAxis" | "gakuchika" | "selfPr" | "strengths" | "weaknesses";

interface CalendarEvent {
  type: "interview" | "deadline" | "other";
  title: string;
  date: string; // YYYY-MM-DD
  companyName?: string;
}

interface SyncResult {
  selfAnalysis: Partial<Record<SelfAnalysisField, string>>;
  newCompanies: string[];
  actionItems: { action: string; reason: string; priority: "high" | "medium" | "low" }[];
  calendarEvents: CalendarEvent[];
  shouldRefreshPdca: boolean;
  companyStatusUpdates: { companyName: string; newStatus: string }[];
  profileUpdates: {
    university?: string;
    faculty?: string;
    graduationYear?: number;
    targetIndustries?: string[];
  };
}

export async function POST(req: NextRequest) {
  const { user: _authUser, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;
  const { allowed } = checkRateLimit(getClientIp(req), "chat-sync");
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const {
      recentMessages,
      existingCompanies,
      existingSelfAnalysis,
      pendingActions,
      existingProfile,
    }: {
      recentMessages: { role: "user" | "assistant"; content: string }[];
      existingCompanies: string[];
      existingSelfAnalysis: Partial<Record<SelfAnalysisField, string>>;
      pendingActions: string[];
      existingProfile?: { university?: string; faculty?: string; graduationYear?: number; targetIndustries?: string[] };
    } = await req.json();

    if (!recentMessages || recentMessages.length === 0) {
      return NextResponse.json<SyncResult>({
        selfAnalysis: {},
        newCompanies: [],
        actionItems: [],
        calendarEvents: [],
        shouldRefreshPdca: false,
        companyStatusUpdates: [],
        profileUpdates: {},
      });
    }

    const conversationText = recentMessages
      .map(m => `[${m.role === "user" ? "ユーザー" : "カレオ"}]: ${m.content}`)
      .join("\n\n");

    const existingCompanyList = existingCompanies.join("、") || "なし";
    const pendingActionList = pendingActions.slice(0, 10).join("、") || "なし";

    const existingAnalysisText = Object.entries(existingSelfAnalysis)
      .filter(([, v]) => v)
      .map(([k, v]) => {
        const labels: Record<string, string> = {
          careerAxis: "就活の軸", gakuchika: "ガクチカ", selfPr: "自己PR",
          strengths: "強み", weaknesses: "弱み",
        };
        return `${labels[k]}: ${String(v).slice(0, 100)}`;
      })
      .join("\n") || "未入力";

    const profileText = existingProfile ? [
      existingProfile.university ? `大学: ${existingProfile.university}` : "",
      existingProfile.faculty ? `学部: ${existingProfile.faculty}` : "",
      existingProfile.graduationYear ? `卒業年: ${existingProfile.graduationYear}` : "",
      existingProfile.targetIndustries?.length ? `志望業界: ${existingProfile.targetIndustries.join("・")}` : "",
    ].filter(Boolean).join("、") : "未入力";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `以下のAIコーチとユーザーの会話から、就活管理アプリに保存すべき情報を抽出してください。

【会話内容】
${conversationText}

【既存データ（重複・上書き防止のため）】
登録済み企業: ${existingCompanyList}
未完了アクション: ${pendingActionList}
既存の自己分析: ${existingAnalysisText}
既存のプロフィール: ${profileText}

【抽出ルール】
1. selfAnalysis: 会話からユーザー自身について語った情報。既存より詳しい内容のみ（空文字不可）。
   careerAxis/gakuchika/selfPr/strengths/weaknesses
2. newCompanies: 「気になる」「受けたい」「志望」と発言した企業。登録済みは除外。
3. actionItems: カレオが「やってみて」と提案した具体的アクション。重複なし、3件以内。
4. calendarEvents: 具体的日付のあるイベント（3件以内、今日=${new Date().toISOString().slice(0, 10)}）。
   type: "interview"（面接・GD・グループディスカッション・説明会・インターン選考含む）|"deadline"（ES締切など）|"other" / date: YYYY-MM-DD
   title: イベントの内容を簡潔に（例: "○○社 GD"、"○○社 1次面接"）/ companyName: 企業名
5. companyStatusUpdates: ユーザーが選考の進捗を報告した場合のみ（例:「A社の面接通過した」「B社に落ちた」「C社から内定もらった」）。
   登録済み企業名のみ対象。newStatus は以下から選ぶ:
   INTERN_APPLYING/INTERN_DOCUMENT/INTERN_INTERVIEW_1/INTERN_INTERVIEW_2/INTERN_FINAL/INTERN/
   APPLIED/DOCUMENT/INTERVIEW_1/INTERVIEW_2/FINAL/OFFERED/REJECTED
6. profileUpdates: ユーザーが大学・学部・卒業年・志望業界を明言した場合のみ。既存と同じなら含めない。
   university/faculty/graduationYear(数値)/targetIndustries(配列)
7. shouldRefreshPdca: 内定・落選・大きな進捗があった場合のみ true。

JSONのみ出力（コードブロック不要）:
{"selfAnalysis":{},"newCompanies":[],"actionItems":[],"calendarEvents":[],"shouldRefreshPdca":false,"companyStatusUpdates":[],"profileUpdates":{}}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json<SyncResult>({
        selfAnalysis: {},
        newCompanies: [],
        actionItems: [],
        calendarEvents: [],
        shouldRefreshPdca: false,
        companyStatusUpdates: [],
        profileUpdates: {},
      });
    }

    const parsed = JSON.parse(jsonMatch[0]) as SyncResult;
    return NextResponse.json<SyncResult>({
      selfAnalysis: parsed.selfAnalysis ?? {},
      newCompanies: Array.isArray(parsed.newCompanies) ? parsed.newCompanies : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [],
      shouldRefreshPdca: parsed.shouldRefreshPdca === true,
      companyStatusUpdates: Array.isArray(parsed.companyStatusUpdates) ? parsed.companyStatusUpdates : [],
      profileUpdates: parsed.profileUpdates ?? {},
    });
  } catch (err) {
    console.error("[chat-sync]", err);
    return NextResponse.json<SyncResult>({
      selfAnalysis: {},
      newCompanies: [],
      actionItems: [],
      calendarEvents: [],
      shouldRefreshPdca: false,
      companyStatusUpdates: [],
      profileUpdates: {},
    });
  }
}
