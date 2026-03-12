import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Company, ES, Interview, UserProfile } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { companies, esList, interviews, profile }: {
    companies: Company[];
    esList: ES[];
    interviews: Interview[];
    profile: UserProfile | null;
  } = await req.json();

  const profileSummary = profile
    ? `
ユーザープロフィール:
- 学年: ${profile.grade}
- 卒業予定: ${profile.graduationYear}年
- 就活の進み具合: ${profile.jobSearchStage === "not_started" ? "まだ始めていない" : profile.jobSearchStage === "just_started" ? "始めたばかり" : "本格的に進めている"}
- 志望業界: ${profile.targetIndustries.length > 0 ? profile.targetIndustries.join("、") : "未設定"}
- 志望職種: ${profile.targetJobs.length > 0 ? profile.targetJobs.join("、") : "未設定"}
`.trim()
    : "プロフィール: 未設定";

  const activitySummary = `
就活実績:
- 企業数: ${companies.length}社（内定: ${companies.filter((c) => c.status === "OFFERED").length}社、選考中: ${companies.filter((c) => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).length}社）
- ES: ${esList.length}件（下書き: ${esList.filter((e) => e.status === "DRAFT").length}件）
- 面接: ${interviews.length}件
- 直近締切: ${esList.filter((e) => e.deadline && e.status === "DRAFT").map((e) => e.title).slice(0, 3).join("、") || "なし"}
`.trim();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `あなたは就活のパーソナルAIアドバイザーです。以下のユーザー情報をもとに、今週やるべきことを具体的に提案してください。就活を始めていない人には基礎的な準備（自己分析、ツール整備など）も含めてアドバイスしてください。

${profileSummary}

${activitySummary}

以下のJSON形式のみで返してください。他のテキストは一切含めないでください。

{
  "summary": "現状の一言評価（1文、具体的に）",
  "weeklyActions": [
    {
      "priority": "high",
      "action": "具体的なアクション（25字以内）",
      "reason": "理由（1文）"
    }
  ]
}

weeklyActionsは3〜5個。priority は "high" / "medium" / "low"。就活未経験者には「就活用Gmailの作成」「自己分析ノートを作る」「SPIの参考書を購入する」のような初歩的なアドバイスも含めること。`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Parse error", raw: text }, { status: 500 });
  }
}
