import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  // 認証チェック
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;
  void user;

  // レート制限チェック
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "progress-check");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const {
      profile = {},
      companies = [],
      interviews = [],
      esList = [],
      aptitudeTests = [],
      currentDate,
    }: {
      profile: {
        graduationYear?: number;
        jobSearchStage?: string;
      };
      companies: {
        name: string;
        status: string;
        industry?: string;
        updatedAt?: string;
      }[];
      interviews: {
        companyName: string;
        round: number;
        result: string;
        scheduledAt: string;
      }[];
      esList: {
        companyName: string;
        status: string;
        deadline?: string;
      }[];
      aptitudeTests: {
        companyName: string;
        testType: string;
        result: string;
      }[];
      currentDate: string;
    } = body;

    const now = new Date(currentDate || new Date().toISOString());
    const gradYear = profile.graduationYear ?? 2028;

    // ── ステール企業の検出（2週間以上動きなし） ──
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const activeStatuses = ["APPLIED", "DOCUMENT", "INTERVIEW_1", "INTERVIEW_2", "FINAL", "INTERN_APPLYING"];
    const staleCompanies = companies
      .filter(c => {
        if (!activeStatuses.includes(c.status)) return false;
        if (!c.updatedAt) return true;
        return new Date(c.updatedAt) < twoWeeksAgo;
      })
      .map(c => c.name);

    // ── 直近のES締切チェック ──
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const upcomingDeadlines = esList
      .filter(e => e.deadline && e.status === "DRAFT")
      .map(e => {
        const deadline = new Date(e.deadline!);
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { company: e.companyName, deadline: e.deadline!, daysLeft };
      })
      .filter(e => e.daysLeft <= 7 && e.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    // ── 面接後の選考停滞チェック ──
    const passedInterviews = interviews.filter(i => i.result === "PASS");
    const stuckAfterInterview = passedInterviews.filter(i => {
      const interviewDate = new Date(i.scheduledAt);
      const daysSince = (now.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24);
      // 通過後2週間以上次の選考がない企業
      const hasNextRound = interviews.some(
        j => j.companyName === i.companyName && j.round > i.round
      );
      return daysSince >= 14 && !hasNextRound;
    });

    // ── 筆記試験未受験で選考が進んでいる企業 ──
    const testedCompanies = new Set(aptitudeTests.map(t => t.companyName));
    const activeWithoutTest = companies.filter(
      c => activeStatuses.includes(c.status) && !testedCompanies.has(c.name)
    );

    // ── 28卒（本選考期）の2月以降の応募が少ない ──
    const isMainSearchPhase = gradYear <= 2027 && now.getMonth() + 1 >= 2;
    const appliedAfterFeb = companies.filter(c => {
      if (!["APPLIED", "DOCUMENT", "INTERVIEW_1", "INTERVIEW_2", "FINAL", "OFFERED"].includes(c.status)) return false;
      if (!c.updatedAt) return false;
      const d = new Date(c.updatedAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() + 1 >= 2;
    });

    // ── データをまとめてAIに渡すプロンプト構築 ──
    const dataLines = [
      `現在日時: ${now.toISOString().slice(0, 10)}`,
      `卒業予定: ${gradYear}年卒`,
      `就活状況: ${profile.jobSearchStage ?? "未設定"}`,
      `登録企業数: ${companies.length}社（選考中: ${companies.filter(c => activeStatuses.includes(c.status)).length}社）`,
      `ES件数: ${esList.length}件（下書き: ${esList.filter(e => e.status === "DRAFT").length}件）`,
      `面接数: ${interviews.length}件（通過: ${passedInterviews.length}件）`,
      `筆記試験: ${aptitudeTests.length}件`,
      staleCompanies.length > 0 ? `ステール企業（2週間以上動きなし）: ${staleCompanies.join("、")}` : "",
      upcomingDeadlines.length > 0 ? `ES締切3日以内（下書き）: ${upcomingDeadlines.slice(0, 3).map(d => `${d.company}(${d.daysLeft}日後)`).join("、")}` : "",
      stuckAfterInterview.length > 0 ? `面接通過後2週間以上停滞: ${stuckAfterInterview.map(i => `${i.companyName} ${i.round}次通過後`).join("、")}` : "",
      activeWithoutTest.length > 0 ? `筆記試験未受験で選考進行中: ${activeWithoutTest.slice(0, 5).map(c => c.name).join("、")}` : "",
      isMainSearchPhase && appliedAfterFeb.length < 5 ? `本選考期（2月以降）の応募企業が${appliedAfterFeb.length}社のみ（5社未満）` : "",
    ].filter(Boolean).join("\n");

    const prompt = `日本の就活コーチAIとして、以下の就活データを分析し、「今最も注意が必要なこと」を検知してください。JSONのみ返答。説明文・マークダウン不要。

${dataLines}

以下の形式のJSONのみ返答:
{
  "alerts": [
    {
      "level": "critical" | "warning" | "info",
      "message": "<具体的な警告文>",
      "action": "<推奨アクション>"
    }
  ],
  "healthScore": <就活の健康度 0-100の整数>,
  "staleCompanies": ["<2週間以上動きのない企業名>"],
  "upcomingDeadlines": [{ "company": "<企業名>", "deadline": "<日付>", "daysLeft": <整数> }],
  "insight": "<全体所感 1-2文>"
}

healthScore基準: 0-30=危機的/31-50=要改善/51-70=普通/71-85=良好/86-100=優秀
alerts は重要度の高い順に最大5件。該当なしの場合は空配列。`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "AIの応答を解析できませんでした" }, { status: 500 });
    }

    const aiResult = JSON.parse(match[0]);

    // AIの結果にローカル計算のデータをマージ（信頼性向上）
    const result = {
      ...aiResult,
      staleCompanies: staleCompanies.length > 0 ? staleCompanies : (aiResult.staleCompanies ?? []),
      upcomingDeadlines: upcomingDeadlines.length > 0 ? upcomingDeadlines : (aiResult.upcomingDeadlines ?? []),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[progress-check] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
