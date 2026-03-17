import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "detect-offer-type");
  if (!allowed) {
    return NextResponse.json({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }, { status: 429 });
  }
  try {
    const { companyName, companyNotes, esList, interviewNotes, recentChatMessages }: {
      companyName: string;
      companyNotes?: string;
      esList?: { title: string; questions: { question: string }[] }[];
      interviewNotes?: string[];
      recentChatMessages?: string[];
    } = await req.json();

    const esInfo = esList && esList.length > 0
      ? esList.map(e => {
          const qs = e.questions.slice(0, 3).map(q => q.question.slice(0, 60)).join(" / ");
          return `ESタイトル「${e.title}」設問: ${qs}`;
        }).join("\n")
      : "ESなし";

    const interviewInfo = interviewNotes && interviewNotes.length > 0
      ? interviewNotes.filter(Boolean).map(n => n.slice(0, 80)).join(" / ")
      : "面接メモなし";

    const chatInfo = recentChatMessages && recentChatMessages.length > 0
      ? recentChatMessages.slice(-10).map(m => m.slice(0, 100)).join(" / ")
      : "なし";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `以下の就活データを見て、この企業への応募が「インターン選考」か「本選考（正社員採用）」かを判定してください。

企業名: ${companyName}
企業メモ: ${companyNotes || "なし"}
ES情報:
${esInfo}
面接メモ: ${interviewInfo}
チャット履歴（ユーザーの発言）: ${chatInfo}

JSONのみ出力。説明不要。
{"isInternOffer": true または false, "reason": "判定理由（20字以内）"}

インターン選考の根拠: ESタイトルや設問に「インターン」「intern」「インターンシップ」が含まれる、企業名に「インターン」が含まれる、面接メモやチャット履歴にインターン関連の記述がある。
本選考の根拠: 「本選考」「新卒採用」「エントリーシート」（一般的）などの記述、または手がかりがない場合。`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ isInternOffer: null, reason: "判定不可" });
    try {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    } catch {
      return NextResponse.json({ isInternOffer: null, reason: "判定不可" });
    }
  } catch (err) {
    console.error("[detect-offer-type] error:", err);
    return NextResponse.json({ isInternOffer: null, reason: "判定不可" });
  }
}
