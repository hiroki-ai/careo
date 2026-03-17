import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 28卒就活スケジュール（実体験ベースのロードマップ）
const SHUKATSU_SCHEDULE_28 = `【28卒就活 月別スケジュール】
3月: メール作成・証明写真・就活会議/ワンキャリ/マイナビキャンパス登録・説明会・サマーインターン応募・Webテスト練習
4〜5月: ES作成（ガクチカ・自己PR）・業界説明会・SPI勉強・面接練習・ベンチャー選考で場数
6〜8月: 夏インターンエントリー（60〜100社目安）・OB/OG訪問・難質問ストック・SPI本番対策
9〜12月: 夏インターン振り返り・早期選考（年内内定も）・冬インターン（本選考直結）・業界絞り込み
1〜3月: 本選考エントリー・企業分析・キャリアプラン・SPI（ラストチャンス）
4月: 内定獲得・就活終了（就活生の6割以上）
重要: 早期選考ルートを狙う・就活の軸を一貫させる・面接は場数が全て・OB/OG訪問は最強の情報源`;

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "chat");
  if (!allowed) {
    return new Response(JSON.stringify({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
    });
  }
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
          strengths?: string;
          weaknesses?: string;
        };
        companies?: { name: string; status: string; industry?: string }[];
        esList?: { title: string; status: string; companyName: string; questionsCount: number }[];
        interviews?: { round: number; result: string; companyName: string; notes?: string }[];
        pendingActions?: string[];
      };
    } = await req.json();

    // ── プロフィール ──
    const profileLines: string[] = [];
    if (context?.profile) {
      const p = context.profile;
      if (p.university || p.faculty) profileLines.push(`大学: ${[p.university, p.faculty].filter(Boolean).join(" ")}`);
      if (p.grade) profileLines.push(`学年: ${p.grade}`);
      if (p.graduationYear) profileLines.push(`卒業予定: ${p.graduationYear}年`);
      if (p.jobSearchStage) {
        const stageLabel: Record<string, string> = { not_started: "就活未開始", just_started: "始めたばかり", ongoing: "本格的に進行中" };
        profileLines.push(`就活状況: ${stageLabel[p.jobSearchStage] ?? p.jobSearchStage}`);
      }
      if (p.targetIndustries?.length) profileLines.push(`志望業界: ${p.targetIndustries.join("・")}`);
      if (p.targetJobs?.length) profileLines.push(`志望職種: ${p.targetJobs.join("・")}`);
    }

    // ── 自己分析 ──
    const analysisLines: string[] = [];
    if (context?.profile) {
      const p = context.profile;
      if (p.careerAxis) analysisLines.push(`就活の軸: ${p.careerAxis.slice(0, 600)}`);
      if (p.gakuchika) analysisLines.push(`ガクチカ: ${p.gakuchika.slice(0, 600)}`);
      if (p.selfPr) analysisLines.push(`自己PR: ${p.selfPr.slice(0, 600)}`);
      if (p.strengths) analysisLines.push(`強み: ${p.strengths.slice(0, 400)}`);
      if (p.weaknesses) analysisLines.push(`弱み: ${p.weaknesses.slice(0, 400)}`);
    }

    // ── 企業管理 ──
    const companyLines: string[] = [];
    if (context?.companies?.length) {
      const statusLabel: Record<string, string> = {
        WISHLIST: "気になる", APPLIED: "応募済み", DOCUMENT: "書類選考中",
        INTERVIEW_1: "1次面接", INTERVIEW_2: "2次面接", FINAL: "最終面接",
        OFFERED: "内定", REJECTED: "不採用",
      };
      companyLines.push(`登録企業 (${context.companies.length}社):`);
      context.companies.slice(0, 20).forEach(c => {
        companyLines.push(`  - ${c.name}${c.industry ? `（${c.industry}）` : ""}: ${statusLabel[c.status] ?? c.status}`);
      });
      if (context.companies.length > 20) companyLines.push(`  ...他${context.companies.length - 20}社`);
    }

    // ── ES ──
    const esLines: string[] = [];
    if (context?.esList?.length) {
      const submitted = context.esList.filter(e => e.status === "SUBMITTED");
      const draft = context.esList.filter(e => e.status === "DRAFT");
      esLines.push(`ES: 計${context.esList.length}件（提出済み${submitted.length}件、下書き${draft.length}件）`);
      context.esList.slice(0, 10).forEach(e => {
        esLines.push(`  - ${e.companyName}「${e.title}」: ${e.status === "SUBMITTED" ? "提出済み" : "下書き"}`);
      });
    }

    // ── 面接 ──
    const interviewLines: string[] = [];
    if (context?.interviews?.length) {
      const resultLabel: Record<string, string> = { PASS: "通過", FAIL: "不通過", PENDING: "結果待ち" };
      interviewLines.push(`面接履歴 (${context.interviews.length}件):`);
      context.interviews.slice(0, 10).forEach(i => {
        interviewLines.push(`  - ${i.companyName} ${i.round}次面接: ${resultLabel[i.result] ?? i.result}`);
      });
    }

    // ── 今週のアクション ──
    const actionLines: string[] = [];
    if (context?.pendingActions?.length) {
      actionLines.push(`今週のTODO: ${context.pendingActions.slice(0, 5).join("、")}`);
    }

    const contextSection = [
      profileLines.length ? `【プロフィール】\n${profileLines.join("\n")}` : "",
      analysisLines.length ? `【自己分析】\n${analysisLines.join("\n")}` : "",
      companyLines.length ? `【企業管理】\n${companyLines.join("\n")}` : "",
      esLines.length ? `【ES状況】\n${esLines.join("\n")}` : "",
      interviewLines.length ? `【面接履歴】\n${interviewLines.join("\n")}` : "",
      actionLines.length ? `【今週のTODO】\n${actionLines.join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

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

【28卒就活スケジュール知識】
現在: ${new Date().getFullYear()}年${new Date().getMonth() + 1}月
${SHUKATSU_SCHEDULE_28}
→ ユーザーの状況と現在の月を照らし合わせ、スケジュールに遅れがあれば優しく教えること。

${contextSection ? `【ユーザーの現在の状況】\n${contextSection}\n\n上記の情報を把握した上で、ユーザーの状況に合わせた個別アドバイスをすること。` : ""}

【重要ルール: 企業追加候補の出力】
ユーザーが「〜に興味ある」「〜が気になる」「〜に応募したい」「〜に行きたい」など、特定の企業名への興味を示した場合は、返答の末尾に必ず以下の形式でタグを追加すること（企業名がすでに企業管理に登録済みの場合は不要）:
[追加候補: 企業名1, 企業名2]
このタグは画面上では企業追加ボタンに変換されるので、必ず正確な企業名を記載すること。

注意事項:
- 就活・キャリア・大学生活に関係する話題に集中する
- 「あなたの場合は〜」という個別対応を心がける
- 自己分析データがあれば、それを活かして具体的にアドバイスする
- 企業管理・ES・面接データがある場合は、それを踏まえて状況を理解した上で話す`;

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.slice(-20),
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
