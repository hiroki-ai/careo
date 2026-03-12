import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Company, ES, Interview } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { companies, esList, interviews }: { companies: Company[]; esList: ES[]; interviews: Interview[] } = await req.json();

  const summary = `
就活状況サマリー:
- 企業数: ${companies.length}社（内定: ${companies.filter((c) => c.status === "OFFERED").length}社、選考中: ${companies.filter((c) => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).length}社、気になる: ${companies.filter((c) => c.status === "WISHLIST").length}社）
- ES: ${esList.length}件（下書き: ${esList.filter((e) => e.status === "DRAFT").length}件、提出済み: ${esList.filter((e) => e.status === "SUBMITTED").length}件）
- 面接: ${interviews.length}件（結果待ち: ${interviews.filter((i) => i.result === "PENDING").length}件、通過: ${interviews.filter((i) => i.result === "PASS").length}件）
- 直近の締切: ${esList.filter((e) => e.deadline && e.status === "DRAFT").map((e) => `${e.title}（${e.deadline}`).join("、") || "なし"}
- 選考中の企業: ${companies.filter((c) => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).map((c) => `${c.name}（${c.status}）`).join("、") || "なし"}
  `.trim();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `あなたは就活のパーソナルAIアドバイザーです。以下の就活状況をもとに、今週やるべきことを提案してください。

${summary}

以下のJSON形式のみで返してください。他のテキストは一切含めないでください。

{
  "summary": "現状の一言評価（1文）",
  "weeklyActions": [
    {
      "priority": "high",
      "action": "具体的なアクション（20字以内）",
      "reason": "理由（1文）"
    }
  ]
}

weeklyActionsは3〜5個、priority は "high" / "medium" / "low" のいずれか。`,
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
