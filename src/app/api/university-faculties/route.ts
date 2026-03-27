import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function GET(req: NextRequest) {
  const university = req.nextUrl.searchParams.get("university");
  if (!university) return NextResponse.json({ faculties: {} });

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `「${university}」の学部と学科の一覧を返してください。
日本語の正式名称で、以下のJSON形式で返してください。
学科が存在しない・不明な場合は空配列にしてください。
大学が存在しない・不明な場合は空オブジェクト {} を返してください。

形式例:
{"経済学部": ["経済学科", "経営学科"], "法学部": ["法律学科"]}

JSONのみ返し、説明文は不要です。`,
        },
      ],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    const faculties: Record<string, string[]> = match ? JSON.parse(match[0]) : {};

    return NextResponse.json({ faculties });
  } catch {
    return NextResponse.json({ faculties: {} });
  }
}
