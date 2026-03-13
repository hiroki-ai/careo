import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { UserProfile } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { profile }: { profile: UserProfile } = await req.json();

    const profileText = `
大学: ${profile.university || "未設定"}
学部: ${profile.faculty || "未設定"}
学年: ${profile.grade}
卒業予定: ${profile.graduationYear}年
志望業界: ${profile.targetIndustries.join("・") || "未設定"}
志望職種: ${profile.targetJobs.join("・") || "未設定"}
就活進捗: ${profile.jobSearchStage}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `就活生の自己分析を手伝ってください。以下のプロフィールをもとに、各項目の下書きを日本語で作成してください。
実際の体験は不明なため、その学部・志望業界・職種の典型的な就活生をイメージして、具体性のある下書きを作成してください。
ユーザーが後で自分の実体験に書き換えることを前提とした「たたき台」として、できるだけ具体的に書いてください。

${profileText}

以下のJSON形式のみで返してください:
{
  "careerAxis": "就活の軸（200字程度）：なぜ働くのか、どんな環境・仕事を求めているか、譲れない価値観を3点程度",
  "gakuchika": "ガクチカ（400字程度）：学生時代に最も力を入れたこと。STAR法（状況・課題・行動・結果）で構成",
  "selfPr": "自己PR（300字程度）：強みを具体的なエピソードとともに、入社後の活躍イメージも含めて",
  "strengths": "強み（箇条書き3点、各50字程度）：具体的なエピソード根拠を含む",
  "weaknesses": "弱みと克服策（200字程度）：正直な弱みと、それをどう改善しているかをセットで"
}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON", raw: text }, { status: 500 });
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("[career-suggest] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
