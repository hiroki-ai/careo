import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(getClientIp(req), "daily-message");
  if (!allowed) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { companies = [], interviews = [], profile = null } = body;

    const offered = companies.filter((c: { status: string }) => c.status === "OFFERED").length;
    const active = companies.filter((c: { status: string }) => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).length;
    const upcoming = interviews.filter((i: { result: string }) => i.result === "PENDING").length;
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 11 ? "おはよう" : hour < 17 ? "こんにちは" : "お疲れさま";

    const context = [
      profile ? `${profile.university || ""}の就活生（${profile.graduationYear || 2028}年卒）` : "就活生",
      `選考中${active}社・内定${offered}社・結果待ち面接${upcoming}件`,
      profile?.careerAxis ? `就活の軸：${String(profile.careerAxis).slice(0, 60)}` : "",
    ].filter(Boolean).join(" / ");

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `就活コーチとして、以下の就活生に今日の一言メッセージを送ってください。
「${greeting}！」で始め、100字以内で前向きな一言のみ返してください。JSONなしのテキストで。

${context}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ message: text });
  } catch (err) {
    console.error("[daily-message]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
