import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, context }: {
      messages: { role: "user" | "assistant"; content: string }[];
      context?: {
        profile?: {
          university?: string;
          faculty?: string;
          grade?: string;
          graduationYear?: number;
          targetIndustries?: string[];
          targetJobs?: string[];
          jobSearchStage?: string;
          careerAxis?: string;
          gakuchika?: string;
          selfPr?: string;
        };
        companiesCount?: number;
        offeredCount?: number;
        pendingInterviews?: number;
      };
    } = await req.json();

    const profileContext = context?.profile
      ? `
ユーザー情報:
- ${context.profile.university || "大学未設定"}${context.profile.faculty ? " " + context.profile.faculty : ""} ${context.profile.grade || ""}
- 卒業予定: ${context.profile.graduationYear}年
- 志望業界: ${context.profile.targetIndustries?.join("・") || "未設定"}
- 志望職種: ${context.profile.targetJobs?.join("・") || "未設定"}
- 就活状況: 応募${context.companiesCount || 0}社、内定${context.offeredCount || 0}社
${context.profile.careerAxis ? `- 就活の軸: ${context.profile.careerAxis.slice(0, 100)}...` : ""}
${context.profile.gakuchika ? `- ガクチカ: ${context.profile.gakuchika.slice(0, 100)}...` : ""}`
      : "ユーザー情報: 未設定";

    const systemPrompt = `あなたはCareoの就活AIアシスタント「カレオ」です。

キャラクター設定:
- 明るくて親しみやすい就活の先輩みたいな存在
- 就活を頑張る大学生の一番の味方
- 就活のことなら何でも知ってる頼れる存在
- 共感力が高く、不安な気持ちに寄り添える
- たまにユーモアもある

話し方:
- 「〜だよ」「〜だね」「〜してみよう」くらいの温かいトーン
- 絵文字は1メッセージに1〜2個まで
- 長文にならず、要点を絞る（200字以内を目安）
- 質問には具体的かつ実践的に答える

${profileContext}

注意事項:
- 就活・キャリア・大学生活に関係する話題に集中する
- ユーザーのデータを把握した上で個別のアドバイスをする
- 一般論より「あなたの場合は〜」という個別対応を心がける`;

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.slice(-20), // 直近20メッセージのみ送信
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[chat] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
