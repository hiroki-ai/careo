import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { postToSlack } from "@/lib/slack/client";
import { detectPersona, PERSONAS } from "@/lib/slack/personas";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Slackの署名を検証 */
function verifySignature(body: string, req: NextRequest): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET ?? "";
  const timestamp = req.headers.get("x-slack-request-timestamp") ?? "";
  const slackSig = req.headers.get("x-slack-signature") ?? "";

  // リプレイ攻撃防止（5分以内のリクエストのみ許可）
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const sigBase = `v0:${timestamp}:${body}`;
  const mySignature =
    "v0=" + crypto.createHmac("sha256", secret).update(sigBase).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(slackSig)
    );
  } catch {
    return false;
  }
}

/** ペルソナとしてClaudeに応答させてSlackに投稿 */
async function respondAsPersona(text: string, personaId?: string) {
  const cleanText = text.replace(/<@[A-Z0-9]+>/g, "").trim();
  const persona = personaId
    ? (PERSONAS.find((p) => p.id === personaId) ?? detectPersona(cleanText))
    : detectPersona(cleanText);

  if (!persona.systemPrompt) return; // 会長（本人）はスキップ

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: `${persona.systemPrompt}

【ルール】
- 会長「ひろき」からのメッセージに対して、自分の役職・専門性の立場から端的に答える
- 3〜5文程度で具体的に答える
- 日本語で返答する
- 絵文字は1〜2個まで
- フレンドリーだが、プロフェッショナルな口調で`,
    messages: [
      {
        role: "user",
        content: `会長からのメッセージ：「${cleanText}」`,
      },
    ],
  });

  const replyText = (response.content[0] as { type: string; text: string }).text;

  await postToSlack({
    text: replyText,
    username: persona.username,
    icon_emoji: persona.icon_emoji,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  // 署名検証
  if (!verifySignature(body, req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // URL検証チャレンジ（Slack App設定時の初回確認）
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  const event = payload.event;
  if (!event) return NextResponse.json({ ok: true });

  // Botのメッセージには反応しない（無限ループ防止）
  if (event.bot_id || event.subtype === "bot_message") {
    return NextResponse.json({ ok: true });
  }

  // メッセージイベントを非同期で処理（Slackの3秒タイムアウト対策）
  if (event.type === "app_mention" || event.type === "message") {
    respondAsPersona(event.text ?? "").catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
