import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";
import { checkAndConsumeAiUsage } from "@/lib/aiUsageLimit";
import { selectAiModel } from "@/lib/aiModel";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type CompanyMini = {
  id: string;
  name: string;
  industry?: string;
  status?: string;
  deadline?: string;
};

type IdentityMini = {
  careerAxis?: string;
  gakuchika?: string;
  strengths?: string;
  axisLayers?: { deepest?: string; middle?: string; surface?: string };
  vision5y?: { career?: string };
  vision10y?: { career?: string };
};

type RecentInterview = {
  companyName: string;
  round: number;
  result?: string;
  notes?: string;
  date?: string;
};

export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "parse-input");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }
  const usage = await checkAndConsumeAiUsage(user.id, "parse-input");
  if (!usage.allowed) {
    return NextResponse.json({
      error: "AI入力解析は今月の無料枠を使い切りました。Proプランで無制限です。",
      limitExceeded: true, feature: "parse-input", limit: usage.limit,
    }, { status: 402 });
  }

  const body = await req.json() as {
    text?: string;
    mode?: "auto" | "identity" | "company" | "interview";
    companies?: CompanyMini[];
    identity?: IdentityMini;
    recentInterviews?: RecentInterview[];
  };

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "入力テキストが必要です" }, { status: 400 });
  }

  const mode = body.mode ?? "auto";
  const companies = body.companies ?? [];
  const identity = body.identity;
  const recents = body.recentInterviews ?? [];

  const companiesList = companies.slice(0, 50)
    .map(c => `- ${c.name}${c.industry ? `(${c.industry})` : ""}${c.status ? ` [${c.status}]` : ""}${c.deadline ? ` 締切:${c.deadline}` : ""} #id=${c.id}`)
    .join("\n");

  const identityLines = identity ? [
    identity.careerAxis && `軸: ${identity.careerAxis.slice(0, 300)}`,
    identity.axisLayers?.deepest && `軸最深層: ${identity.axisLayers.deepest.slice(0, 200)}`,
    identity.gakuchika && `ガクチカ: ${identity.gakuchika.slice(0, 300)}`,
    identity.strengths && `強み: ${identity.strengths.slice(0, 200)}`,
    identity.vision5y?.career && `5年後ビジョン: ${identity.vision5y.career.slice(0, 200)}`,
    identity.vision10y?.career && `10年後ビジョン: ${identity.vision10y.career.slice(0, 200)}`,
  ].filter(Boolean).join("\n") : "";

  const recentsLines = recents.slice(0, 10)
    .map(r => `- ${r.companyName} ${r.round}次 ${r.result ?? "未確定"}${r.date ? ` (${r.date})` : ""}${r.notes ? ` メモ: ${r.notes.slice(0, 100)}` : ""}`)
    .join("\n");

  const modeHint =
    mode === "identity" ? "ユーザーは自分の軸・ガクチカ・強み・ビジョンに関する話をしている可能性が高い。識別が曖昧なら identity_update を優先する。" :
    mode === "company"  ? "ユーザーは企業や選考プロセスに関する話をしている可能性が高い。" :
    mode === "interview" ? "ユーザーは面接の振り返り・結果を話している可能性が高い。interview_create / company_update（ステータス変更）を優先する。" :
    "用途は不明。テキストから自動で判定する。";

  const prompt = `あなたは Careo（就活管理アプリ）の AI アシスタント。
ユーザーの自由テキスト入力を Careo のデータ構造に変換します。
さらに、本人の Identity（軸・ガクチカ・強み・ビジョン）と過去の選考プロセスを照らして、PDCA を回す「次の一手」を提案します。

【モード】${modeHint}

【ユーザー入力】
${body.text}

${identityLines ? `【本人の Identity】\n${identityLines}\n` : ""}
${companiesList ? `【登録済み企業】\n${companiesList}\n` : ""}
${recentsLines ? `【直近の面接ログ】\n${recentsLines}\n` : ""}

【利用可能な選考ステータス】
WISHLIST(気になる) / MYPAGE_REGISTERED(マイページ登録済) / DM_CONTACT(DMコンタクト中) / CASUAL_MEETING(カジュアル面談) / REFERRAL(リファラル) / INTERN_APPLYING / INTERN_DOCUMENT / INTERN_WEB_TEST / INTERN_INTERVIEW_1 / INTERN_INTERVIEW_2 / INTERN_FINAL / INTERN(参加中) / APPLIED(応募済) / DOCUMENT(書類選考中) / WEB_TEST / INTERVIEW_1(1次) / INTERVIEW_2(2次) / INTERVIEW_3(3次) / FINAL(最終) / OFFERED(内定) / REJECTED(不採用) / WITHDRAWN(辞退) / SUMMER_MISSED(サマー見逃し) / INTERNSHIP_REJECTED(インターン不通過)

【優先順位の自動整理】
- ユーザーが「これが本命」「これは後回し」「これとこれどっちが大事?」のような優先順位の話をしている場合、関連する企業の priority フィールド（S/A/B/C）を更新する company_update を含めること
- S = 本命・絶対受ける / A = 強く受けたい / B = 受けるか検討 / C = ウォッチのみ
- 既存の passScore・axis_match・本人の軸を踏まえて整理する
- 複数企業の順位を整える場合、それぞれの company_update を actions に並べる
- 暗黙的に priority に関する判定が出る場合（「サイバー二次面接決まった」→ priority を上げる方向）も、必要なら priority を一緒に動かす

【出力ルール】
- 必ず以下のJSONのみ返す（説明文・マークダウン・コードブロック禁止）
- 該当する actions だけ含める。何も該当しない時は actions:[] でOK
- 企業名から登録済みリストに match があれば companyId を使う、なければ companyName のみ
- ステータスは上記から選ぶ。曖昧なら推測せず status は省略する
- "next_actions" は本人がすぐ取れる具体行動。1〜3個、各20-60字程度
- "pdca_insight" は Identity・過去プロセスから見えるパターンを1-2文で（無理に書かなくて良い）

{
  "intent": "company_update" | "company_create" | "interview_create" | "es_create" | "ob_visit_create" | "event_create" | "identity_patch" | "mixed" | "unclear",
  "actions": [
    // 各 action は type ごとに以下のいずれか
    // 1) 既存企業のステータス・締切・メモ等を更新
    // {"type":"company_update", "companyId":"<id>", "patch": {"status":"...", "deadline":"...", "notes":"..."}}
    //
    // 2) 新しい企業を登録
    // {"type":"company_create", "data": {"name":"...", "industry":"...", "status":"WISHLIST"}}
    //
    // 3) 面接ログを追加
    // {"type":"interview_create", "companyId":"<id?>", "companyName":"<name>", "data": {"round":2, "scheduledAt":"2026-06-20T14:00", "purpose":"二次選考"}}
    //
    // 4) ES作成
    // {"type":"es_create", "companyId":"<id?>", "companyName":"<name>", "data": {"title":"...", "deadline":"..."}}
    //
    // 5) OB訪問記録
    // {"type":"ob_visit_create", "data": {"companyName":"...", "personName":"...", "visitedAt":"...", "insights":"..."}}
    //
    // 6) イベント（説明会・インターン日程）
    // {"type":"event_create", "data": {"companyName":"...", "eventType":"説明会", "scheduledAt":"..."}}
    //
    // 7) Identity の更新（軸・強み・ビジョン）
    // {"type":"identity_patch", "patch": {"careerAxis":"...", "strengths":"...", "axisLayers": {"deepest":"..."}, "vision5y": {"career":"..."}}}
  ],
  "summary": "実行した内容を1文で（例: 「サイバーエージェントを INTERVIEW_2 に更新、面接ログを作成」）",
  "next_actions": ["次の一手1", "次の一手2"],
  "pdca_insight": "本人のIdentity・過去プロセスから見える示唆（1-2文・なければ空文字）"
}`;

  const { model } = await selectAiModel(user.id);
  const message = await anthropic.messages.create({
    model,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text ?? "";
  const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "解析結果の取得に失敗しました" }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (!Array.isArray(parsed.next_actions)) parsed.next_actions = [];
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "JSON解析に失敗しました" }, { status: 500 });
  }
}
