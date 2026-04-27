import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 「5月上旬」等を数値キーに変換（ソート用）
 * 5月上旬=501 / 5月中旬=502 / 5月下旬=503 ...
 */
function toSortKey(display: string): number | null {
  const m = display.match(/(\d{1,2})月(上|中|下)旬/);
  if (!m) return null;
  const month = Number(m[1]);
  const part = m[2] === "上" ? 1 : m[2] === "中" ? 2 : 3;
  return month * 100 + part;
}

/**
 * 毎週月曜朝7時JSTに実行。
 * - 既存企業の締切目安を更新
 * - 「締切が近い」企業の発掘（追加候補）も Claude に依頼してDB追記
 * - 合同説明会・業界研究セミナーの最新スケジュールも更新
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (process.env.CRON_SECRET && authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = service();
  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + (new Date().getMonth() >= 8 ? 2 : 1);

  const { data: existing } = await supabase
    .from("summer_intern_deadlines")
    .select("company_name, industry, deadline_display, provider, provider_url")
    .eq("year", targetYear);

  if (!existing || existing.length === 0) {
    return NextResponse.json({ error: "no seed data for year " + targetYear }, { status: 500 });
  }

  // ── ① 既存締切の更新 + 追加企業の発掘 ────────────────────────
  const companyList = existing.map((e) => `${e.company_name}（${e.industry}）: 前回=${e.deadline_display}`).join("\n");
  const existingNames = new Set(existing.map((e) => e.company_name));

  const updateSystem = `あなたは日本の新卒採用市場に詳しいリサーチャーです。${targetYear}年サマーインターンの応募締切と新規追加候補を返してください。`;
  const updateUserMsg = `現在: ${new Date().toISOString().slice(0, 10)}
対象年: ${targetYear}年夏インターン

【タスク1】以下の既存企業について、応募締切目安を「5月上旬/中旬/下旬」「6月上旬/中旬/下旬」「7月上旬/中旬/下旬」の形式で更新。不明なら前回値を維持、大きく変動した時のみ変更。

${companyList}

【タスク2】上記に含まれていない、28卒就活生が知っておくべき「締切が近い」サマーインターン実施企業を10社まで追加候補として提案。日本の新卒採用で実際にサマーインターンを実施する企業に限る。

【重要】JSONのみで返答。説明文・マークダウン・コードブロック禁止。

{
  "updates": [
    { "company_name": "〇〇", "deadline_display": "6月上旬", "note": null }
  ],
  "additions": [
    { "company_name": "〇〇", "industry": "業界", "deadline_display": "6月中旬", "note": null }
  ]
}`;

  let changed = 0;
  let added = 0;
  try {
    const r1 = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      system: updateSystem,
      messages: [{ role: "user", content: updateUserMsg }],
    });
    const text1 = (r1.content[0] as { type: string; text: string }).text;
    const raw1 = text1.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const m1 = raw1.match(/\{[\s\S]*\}/);
    if (m1) {
      const parsed = JSON.parse(m1[0]) as {
        updates?: { company_name: string; deadline_display: string; note?: string | null }[];
        additions?: { company_name: string; industry: string; deadline_display: string; note?: string | null }[];
      };

      for (const u of parsed.updates ?? []) {
        const sortKey = toSortKey(u.deadline_display);
        if (!sortKey) continue;
        const { error } = await supabase
          .from("summer_intern_deadlines")
          .update({
            deadline_display: u.deadline_display,
            deadline_sort_key: sortKey,
            note: u.note ?? null,
            confidence: "estimated",
            updated_at: new Date().toISOString(),
          })
          .eq("year", targetYear)
          .eq("company_name", u.company_name);
        if (!error) changed += 1;
      }

      for (const a of parsed.additions ?? []) {
        if (existingNames.has(a.company_name)) continue;
        const sortKey = toSortKey(a.deadline_display);
        if (!sortKey) continue;
        const provider_url = `https://job.mynavi.jp/28/pub/?srch=${encodeURIComponent(a.company_name)}`;
        const { error } = await supabase
          .from("summer_intern_deadlines")
          .insert({
            year: targetYear,
            company_name: a.company_name,
            industry: a.industry,
            deadline_display: a.deadline_display,
            deadline_sort_key: sortKey,
            note: a.note ?? null,
            confidence: "estimated",
            provider: "mynavi",
            provider_url,
          });
        if (!error) added += 1;
      }
    }
  } catch (err) {
    console.error("[summer-intern-research] update phase error", err);
  }

  // ── ② 合同説明会・イベント情報の更新 ────────────────────────
  let eventsAdded = 0;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: existingEvents } = await supabase
      .from("joint_events")
      .select("title, start_date")
      .eq("year", targetYear)
      .gte("start_date", today);
    const existingTitles = new Set((existingEvents ?? []).map((e) => `${e.title}|${e.start_date}`));

    const eventSystem = `あなたは日本の新卒採用イベント（マイナビ・キャリタス就活・ONE CAREER・リクナビ・外資就活ドットコム等が主催する合同説明会・業界研究セミナー）に詳しいリサーチャーです。${targetYear}年5月〜7月開催のイベントを返してください。`;
    const eventUserMsg = `現在: ${today}
対象年: ${targetYear}年5月〜7月開催の合同説明会・業界研究セミナー

【タスク】28卒向けに開催される、マイナビ・キャリタス就活・ONE CAREER・リクナビ・外資就活ドットコム主催のイベントを10件提案。
- start_date / end_date は YYYY-MM-DD 形式
- provider は 'mynavi' | 'careertasu' | 'onecareer' | 'rikunabi' | 'gaishishukatsu' のいずれか
- registration_url は各サービスのイベントページ
- 開催情報が不明なものは含めない

【重要】JSONのみで返答。説明文・マークダウン・コードブロック禁止。

{
  "events": [
    {
      "title": "マイナビ就職EXPO 東京会場",
      "organizer": "マイナビ",
      "category": "合同説明会",
      "start_date": "${targetYear}-05-17",
      "end_date": "${targetYear}-05-18",
      "location": "東京ビッグサイト",
      "target_industries": ["総合", "商社", "金融"],
      "registration_url": "https://job.mynavi.jp/conts/.../expo/",
      "provider": "mynavi"
    }
  ]
}`;

    const r2 = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system: eventSystem,
      messages: [{ role: "user", content: eventUserMsg }],
    });
    const text2 = (r2.content[0] as { type: string; text: string }).text;
    const raw2 = text2.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const m2 = raw2.match(/\{[\s\S]*\}/);
    if (m2) {
      const parsed = JSON.parse(m2[0]) as {
        events?: {
          title: string;
          organizer: string;
          category?: string | null;
          start_date: string;
          end_date?: string | null;
          location?: string | null;
          target_industries?: string[] | null;
          registration_url?: string | null;
          provider?: string | null;
        }[];
      };
      for (const ev of parsed.events ?? []) {
        const key = `${ev.title}|${ev.start_date}`;
        if (existingTitles.has(key)) continue;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.start_date)) continue;
        const { error } = await supabase.from("joint_events").insert({
          year: targetYear,
          title: ev.title,
          organizer: ev.organizer,
          category: ev.category ?? null,
          start_date: ev.start_date,
          end_date: ev.end_date ?? null,
          location: ev.location ?? null,
          target_industries: ev.target_industries ?? null,
          registration_url: ev.registration_url ?? null,
          provider: ev.provider ?? null,
          confidence: "estimated",
        });
        if (!error) eventsAdded += 1;
      }
    }
  } catch (err) {
    console.error("[summer-intern-research] events phase error", err);
  }

  return NextResponse.json({
    ok: true,
    year: targetYear,
    deadlines_updated: changed,
    deadlines_added: added,
    events_added: eventsAdded,
  });
}
