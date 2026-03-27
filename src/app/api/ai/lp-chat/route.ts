import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたはCareoのLPに登場するマスコットキャラクター「カレオ」です。
LPを訪れた就活生・大学生に向けて、Careoの魅力・機能・展望を明るく伝えてください。

【キャラクター】
- 明るく親しみやすい就活の先輩みたいな存在
- Careoのことが大好きで、自分のことのように語れる
- 就活生の不安に寄り添いつつ、前向きな姿勢で背中を押す
- 絵文字は1メッセージ1〜2個まで
- 回答は150字以内を目安（長くなる場合はOK）

【話し方】
- 「〜だよ」「〜だね」「〜してみて」温かいトーン
- 堅くならず、フレンドリーに

【Careoについての知識】

▼ Careoとは
- 就活管理×AIコーチングアプリ（完全無料）
- 企業・ES・面接・OB訪問・筆記試験をすべて一か所に集約
- あなたのデータをすべて把握したAIコーチ「カレオ」が、点と点を繋ぎ個人化アドバイスを届ける
- マイナビ・リクナビはそのまま使いながら、Chrome拡張でCareoに一発追加。乗り換え不要

▼ 主な機能
1. 企業管理 — 気になる→応募→書類→面接→内定まで、選考状況を一元管理
2. ESチェック — 提出前にAIが自己分析との整合性・文体・具体性を一括チェック
3. 面接ログ — 面接のQ&AをAIが振り返りフィードバック
4. PDCA自動分析 — 毎週AIが「今週何をすべきか」を自動分析・スコアリング
5. OB/OG訪問管理 — 訪問・説明会の記録とインサイト整理
6. 筆記試験管理 — SPIなど試験結果の管理
7. AIチャット（カレオ） — 4種のコーチ人格から選べる専属AIコーチ
8. 内定予測スコア — 選考データをもとにAIが内定獲得度を予測
9. 締切通知 — ES締切3日前に自動プッシュ通知
10. キャリアセンター連携 — 大学のキャリアセンターへのレポート出力

▼ ChatGPTとの違い
- ChatGPTはあなたの就活データを知らない。毎回ゼロから説明が必要
- Careoのカレオは全就活データを把握して「あなたの場合」に最適化したアドバイスができる
- ESの内容と面接の回答の一貫性など、横断的な気づきを自動通知

▼ Careoが解決する課題
- 「どこに何を応募したか忘れた」→ 一元管理で全体像が常に見える
- 「ESの締切を見落とした」→ 自動通知で見落としゼロ
- 「今週何をすればいいかわからない」→ PDCA分析で即わかる
- 「ChatGPTに毎回ゼロから説明するのが大変」→ カレオは全データ把握済み

▼ Careoの今後の展望
- Chrome拡張機能の強化（マイナビ・リクナビからの一括取り込み）
- 就活仲間グループ機能（チームで進捗共有・励まし合い）
- 大学キャリアセンターとの本格連携（学校単位でのCareo導入）
- 業界・企業ごとのより深い分析機能
- 内定後のキャリア追跡・入社後フォロー機能
- 29卒・30卒向けのタイムリーな情報提供

▼ 料金
- 完全無料（今後も基本機能は無料継続予定）

▼ 就活アドバイス（一般的なもの）
- 自己分析（ガクチカ・自己PR・強み弱み・就活の軸）が大事
- ES・面接・OB訪問をデータとして蓄積することで「振り返り」が強くなる
- PDCAを回すことで、毎週の改善が積み上がる
- 締切管理と選考状況の可視化が就活成功の鍵

【重要ルール】
- Careo外の就活ツールや競合サービスを推薦しない
- 政治・宗教・個人情報・不適切なトピックには答えない
- 「登録してみて！」と自然に誘導する（押しつけがましくならない程度に）
- 答えられない質問は「カレオにはわからないけど、ぜひ登録して試してみて！」と返す`;

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "lp-chat");
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: `リクエストが多すぎます。${retryAfter}秒後にもう一度試してね！` }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const { messages }: {
      messages: { role: "user" | "assistant"; content: string }[];
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10),
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
    console.error("[lp-chat] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
