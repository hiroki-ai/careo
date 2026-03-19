import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getShukatsuContext } from "@/lib/shukatsuSchedule";
import { requireAuth, checkDailyChatLimit } from "@/lib/apiAuth";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  // 認証チェック（未ログインは401）
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  // 1分あたりのIPレート制限
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "chat");
  if (!allowed) {
    return new Response(JSON.stringify({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
    });
  }

  // 1日チャット上限チェック（管理者は無制限）
  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const { errorResponse: limitError } = await checkDailyChatLimit(user.id, isAdmin);
  if (limitError) return limitError;

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
        companies?: { name: string; status: string; industry?: string; is_intern_offer?: boolean | null }[];
        esList?: { title: string; status: string; companyName: string; questions: { question: string; answer: string }[] }[];
        interviews?: { round: number; result: string; companyName: string; notes?: string }[];
        obVisits?: { companyName: string; purpose: string; impression?: string; insights?: string }[];
        aptitudeTests?: { companyName: string; testType: string; result: string; scoreVerbal?: number; scoreNonverbal?: number }[];
        pendingActions?: string[];
        completedActions?: string[];
        lastPdca?: {
          plan?: { weeklyGoal?: string; taskCompletion?: string };
          do?: { highlights?: string[]; totalActivity?: string };
          check?: { score?: number; goodPoints?: string[]; issues?: string[]; insight?: string };
          act?: { improvements?: string[]; nextWeekFocus?: string; encouragement?: string };
        } | null;
      };
    } = await req.json();

    // ── プロフィール ──
    const profileLines: string[] = [];
    const missingProfile: string[] = [];
    if (context?.profile) {
      const p = context.profile;
      if (p.university || p.faculty) profileLines.push(`大学: ${[p.university, p.faculty].filter(Boolean).join(" ")}`);
      else missingProfile.push("大学・学部");
      if (p.grade) profileLines.push(`学年: ${p.grade}`);
      if (p.graduationYear) profileLines.push(`卒業予定: ${p.graduationYear}年`);
      if (p.jobSearchStage) {
        const stageLabel: Record<string, string> = { not_started: "就活未開始", just_started: "始めたばかり", ongoing: "本格的に進行中" };
        profileLines.push(`就活状況: ${stageLabel[p.jobSearchStage] ?? p.jobSearchStage}`);
      }
      if (p.targetIndustries?.length) profileLines.push(`志望業界: ${p.targetIndustries.join("・")}`);
      else missingProfile.push("志望業界");
      if (p.targetJobs?.length) profileLines.push(`志望職種: ${p.targetJobs.join("・")}`);
    }

    // ── 自己分析 ──
    const analysisLines: string[] = [];
    const missingAnalysis: string[] = [];
    if (context?.profile) {
      const p = context.profile;
      if (p.careerAxis) analysisLines.push(`就活の軸: ${p.careerAxis.slice(0, 600)}`);
      else missingAnalysis.push("就活の軸");
      if (p.gakuchika) analysisLines.push(`ガクチカ: ${p.gakuchika.slice(0, 600)}`);
      else missingAnalysis.push("ガクチカ");
      if (p.selfPr) analysisLines.push(`自己PR: ${p.selfPr.slice(0, 600)}`);
      else missingAnalysis.push("自己PR");
      if (p.strengths) analysisLines.push(`強み: ${p.strengths.slice(0, 400)}`);
      if (p.weaknesses) analysisLines.push(`弱み: ${p.weaknesses.slice(0, 400)}`);
    }

    // ── 企業管理 ──
    const companyLines: string[] = [];
    if (context?.companies?.length) {
      const statusLabel: Record<string, string> = {
        WISHLIST: "気になる", INTERN_APPLYING: "インターン選考中", INTERN: "インターン中",
        APPLIED: "応募済み", DOCUMENT: "書類選考中",
        INTERVIEW_1: "1次面接", INTERVIEW_2: "2次面接", FINAL: "最終面接",
        OFFERED: "合格/内定", REJECTED: "不採用",
      };
      companyLines.push(`登録企業 (${context.companies.length}社):`);
      context.companies.slice(0, 20).forEach(c => {
        const label = c.status === "OFFERED"
          ? (c.is_intern_offer ? "インターン合格" : "内定")
          : (statusLabel[c.status] ?? c.status);
        companyLines.push(`  - ${c.name}${c.industry ? `（${c.industry}）` : ""}: ${label}`);
      });
      if (context.companies.length > 20) companyLines.push(`  ...他${context.companies.length - 20}社`);
    }

    // ── ES ──
    const esLines: string[] = [];
    if (context?.esList?.length) {
      const submitted = context.esList.filter(e => e.status === "SUBMITTED");
      const draft = context.esList.filter(e => e.status === "DRAFT");
      esLines.push(`ES: 計${context.esList.length}件（提出済み${submitted.length}件、下書き${draft.length}件）`);
      context.esList.slice(0, 8).forEach(e => {
        const statusLabel = e.status === "SUBMITTED" ? "提出済み" : "下書き";
        esLines.push(`  ■ ${e.companyName}「${e.title}」[${statusLabel}]`);
        e.questions.slice(0, 4).forEach(q => {
          esLines.push(`    Q: ${q.question.slice(0, 80)}`);
          if (q.answer) esLines.push(`    A: ${q.answer.slice(0, 300)}`);
        });
      });
    }

    // ── 面接 ──
    const interviewLines: string[] = [];
    if (context?.interviews?.length) {
      const resultLabel: Record<string, string> = { PASS: "通過", FAIL: "不通過", PENDING: "結果待ち" };
      interviewLines.push(`面接履歴 (${context.interviews.length}件):`);
      context.interviews.slice(0, 10).forEach(i => {
        const base = `  - ${i.companyName} ${i.round}次面接: ${resultLabel[i.result] ?? i.result}`;
        interviewLines.push(i.notes ? `${base}（メモ: ${i.notes.slice(0, 80)}）` : base);
      });
    }

    // ── OB訪問 ──
    const obLines: string[] = [];
    if (context?.obVisits?.length) {
      const purposeLabel: Record<string, string> = { ob_visit: "OB/OG訪問", info_session: "会社説明会", internship: "インターン" };
      obLines.push(`OB/OG訪問・説明会 (${context.obVisits.length}件):`);
      context.obVisits.slice(0, 5).forEach(v => {
        const imp = v.impression === "positive" ? "好印象" : v.impression === "negative" ? "懸念あり" : "";
        obLines.push(`  - ${v.companyName}（${purposeLabel[v.purpose] ?? v.purpose}）${imp ? `[${imp}]` : ""}`);
        if (v.insights) obLines.push(`    気づき: ${v.insights.slice(0, 100)}`);
      });
    }

    // ── 筆記試験 ──
    const testLines: string[] = [];
    if (context?.aptitudeTests?.length) {
      testLines.push(`筆記試験 (${context.aptitudeTests.length}件):`);
      context.aptitudeTests.slice(0, 5).forEach(t => {
        const scores = [
          t.scoreVerbal != null ? `言語${t.scoreVerbal}` : null,
          t.scoreNonverbal != null ? `非言語${t.scoreNonverbal}` : null,
        ].filter(Boolean).join("・");
        testLines.push(`  - ${t.companyName} ${t.testType}: ${t.result}${scores ? `（${scores}）` : ""}`);
      });
    }

    // ── PDCA ──
    const pdcaLines: string[] = [];
    if (context?.lastPdca) {
      const p = context.lastPdca;
      if (p.check?.score != null) pdcaLines.push(`直近PDCAスコア: ${p.check.score}/100`);
      if (p.check?.insight) pdcaLines.push(`現状分析: ${p.check.insight}`);
      if (p.check?.issues?.length) pdcaLines.push(`課題: ${p.check.issues.slice(0, 3).join(" / ")}`);
      if (p.check?.goodPoints?.length) pdcaLines.push(`うまくいっている点: ${p.check.goodPoints.slice(0, 2).join(" / ")}`);
      if (p.act?.improvements?.length) pdcaLines.push(`AIが提案する改善アクション: ${p.act.improvements.slice(0, 3).join(" / ")}`);
      if (p.act?.nextWeekFocus) pdcaLines.push(`来週の最重要テーマ: ${p.act.nextWeekFocus}`);
    }

    // ── アクション ──
    const actionLines: string[] = [];
    if (context?.pendingActions?.length) {
      actionLines.push(`今週のTODO: ${context.pendingActions.slice(0, 5).join("、")}`);
    }
    if (context?.completedActions?.length) {
      actionLines.push(`最近完了したこと: ${context.completedActions.slice(0, 3).join("、")}`);
    }

    const contextSection = [
      profileLines.length ? `【プロフィール】\n${profileLines.join("\n")}` : "",
      analysisLines.length ? `【自己分析】\n${analysisLines.join("\n")}` : "【自己分析】未入力",
      companyLines.length ? `【企業管理】\n${companyLines.join("\n")}` : "【企業管理】登録なし",
      esLines.length ? `【ES状況】\n${esLines.join("\n")}` : "",
      interviewLines.length ? `【面接履歴】\n${interviewLines.join("\n")}` : "",
      obLines.length ? `【OB/OG訪問・説明会】\n${obLines.join("\n")}` : "",
      testLines.length ? `【筆記試験】\n${testLines.join("\n")}` : "",
      pdcaLines.length ? `【直近のPDCA分析結果】\n${pdcaLines.join("\n")}` : "",
      actionLines.length ? `【アクション】\n${actionLines.join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    // 未入力情報のリスト（自然な会話で引き出すためのヒント）
    const allMissing = [...missingProfile, ...missingAnalysis];

    const systemPrompt = `あなたはCareoの就活AIアシスタント「カレオ」です。

【キャラクター】
- 明るく親しみやすい就活の先輩みたいな存在
- 就活を頑張る大学生の最強の味方
- 共感力が高く、不安な気持ちにも寄り添える
- たまにユーモアもある、でも真剣なときは真剣に

【話し方】
- 「〜だよ」「〜だね」「〜してみよう」温かいトーン
- 絵文字は1メッセージに1〜2個まで
- 200字以内を目安（聞かれた内容によっては長くてもOK）
- 質問には具体的かつ実践的に答える

【就活スケジュール知識】
現在: ${new Date().getFullYear()}年${new Date().getMonth() + 1}月
${(() => { const grad = context?.profile?.graduationYear ?? 2028; const ctx = getShukatsuContext(grad); return `対象: ${ctx.nendoLabel} / 現在フェーズ: ${ctx.phase}\n${ctx.phaseDetail}\n${ctx.schedule}\n\n今やるべきこと: ${ctx.currentAdvice}`; })()}

【ユーザーのCareoデータ（すべて把握済み）】
${contextSection}

${allMissing.length > 0 ? `【自己分析が不十分】まだ入力されていない: ${allMissing.join("、")}
→ 会話のどこかで自然に1つずつ聞き出すこと（一度に全部聞かない）。例: 「ちなみにガクチカはもう考えてる？」「就活の軸って決まってる？」
→ 話してくれたらまとめて [自己分析: field | content] タグで保存する。` : "【自己分析: すべて入力済み】"}

【重要ルール: 情報の扱い方】
1. 登録済みの情報は絶対に再確認しない
   NG例: 「志望業界を教えてください」（すでに登録されているなら参照するだけ）
   OK例: 「${context?.profile?.targetIndustries?.length ? `${context.profile.targetIndustries[0]}志望なんだね、` : ""}〜」と自然に使う
2. 未入力の情報は会話の流れで自然に聞いて引き出す（1回に1つだけ）
3. 聞いた情報は「それ、Careoの○○機能に記録しておくといいよ！」と誘導する

【機能連携ガイド（適切なタイミングで誘導する）】
- 面接の話 → 「/interviews で面接ログを記録しておこう」
- ESを書きたい → 「/es のAI生成機能を使ってみて」
- OB訪問した → 「/ob-visits に記録すると後から振り返れるよ」
- 企業に興味 → [追加候補: 企業名] タグで企業管理に追加
- 自己分析を整理したい → [自己分析: field | content] タグで自動保存
- 筆記試験を受けた → 「/tests に結果を記録しておこう」

【企業数が少ないとき】
登録企業が5社未満の場合は、会話の流れで「どんな業界・企業が気になってる？」と聞いて一緒にリストアップする。気になる企業名が出てきたら [追加候補: 企業名] タグを使う。

【PDCAを使った主体的コーチング】
直近のPDCA分析結果がある場合、以下を積極的に行うこと:
1. 会話開始時や相談内容に関連するとき、「PDCAで○○が課題として出てたんだけど、それについて一緒に考えよう」と自発的に切り出す
2. 課題（issues）に対して具体的な改善策を1つ提案し、「今週これだけやってみて」と絞り込む
3. うまくいっている点（goodPoints）は積極的に褒めて自信をつける
4. 来週の最重要テーマ（nextWeekFocus）に沿ったアドバイスを優先する
5. ユーザーが漠然と「どうすればいい？」と聞いてきたとき、PDCAの改善アクション（improvements）を参考に具体的に答える
→ PDCAデータがない場合は「ダッシュボードでPDCA分析を実行すると、もっと具体的にアドバイスできるよ！」と促す

【OFFERED判定サポート】
ユーザーが「〜に受かった」「〜から内定もらった」「〜のインターン合格した」と言ったとき:
- インターン合格か本選考の内定かを文脈から判断する
- 企業管理のステータス更新を促す: 「企業管理で「インターン合格」か「内定」を設定しておこう！ステータスを更新すると、AIの分析にも反映されるよ」

【自己分析の自動保存タグ】
ユーザーが自己分析の内容（就活の軸・ガクチカ・自己PR・強み・弱み）をチャットで話し、または一緒に作り上げたとき、返答の末尾に以下の形式のタグを追加すること:
[自己分析: <field> | <content>]

fieldは必ず以下のいずれか（英語で）:
- careerAxis（就活の軸）
- gakuchika（ガクチカ・学生時代に力を入れたこと）
- selfPr（自己PR）
- strengths（強み）
- weaknesses（弱み）

contentはユーザーが語った・一緒にまとめた内容の文章（句読点込みで完成したもの）

例: ユーザーと一緒にガクチカをまとめたとき:
[自己分析: gakuchika | テニスサークルの副代表として〜]

【自己分析タグの出力ルール】
- 内容がまだ途中・曖昧なときはタグを出力しない
- すでにCareoのプロフィールに同じ内容が入力済みなら出力しない
- ユーザーが「まとめて」「整理して」と言ったとき、または内容が文章としてまとまったときのみ出力
- 複数の分野がまとまった場合は複数行に出力してよい

【企業追加候補の出力ルール】
ユーザーが「〜に興味ある」「〜が気になる」など特定の企業名への興味を示した場合のみ:
[追加候補: 企業名1, 企業名2]
（すでに企業管理に登録済みの場合は不要）

【注意事項】
- 就活・キャリア・大学生活に関係する話題に集中する
- 「あなたの場合は〜」という個別対応を心がける（登録データをフル活用）
- OB訪問や面接のメモがあれば、それを踏まえて具体的にアドバイス
- 合格/内定の「インターン合格」か「内定（本選考）」かは文脈で判断して区別する`;

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
