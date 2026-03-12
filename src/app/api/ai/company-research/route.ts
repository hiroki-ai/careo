import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { companyName } = await req.json();
  if (!companyName) return NextResponse.json({ error: "companyName required" }, { status: 400 });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `就活生向けに「${companyName}」の企業研究をまとめてください。以下のJSON形式で返してください。他のテキストは一切含めないでください。

{
  "business": "事業内容の説明（2〜3文）",
  "competitors": ["競合企業1", "競合企業2", "競合企業3"],
  "motivationAngles": ["志望動機の切り口1", "志望動機の切り口2", "志望動機の切り口3"],
  "strengths": ["企業の強み1", "企業の強み2", "企業の強み3"],
  "reverseQuestions": ["逆質問候補1", "逆質問候補2", "逆質問候補3"]
}`,
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
