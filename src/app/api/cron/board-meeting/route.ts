import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { runMeeting } from "@/lib/board/runMeeting";
import type { MeetingResult } from "@/lib/board/runMeeting";

const FOUNDER_EMAIL = "hiroki.a0625@gmail.com";

function buildEmailHtml(result: MeetingResult, sessionLabel: string): string {
  const discussionHtml = result.discussion
    .map(
      (msg) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;">
          <div style="font-size:11px;font-weight:700;color:#4f46e5;margin-bottom:4px;">
            ${msg.name}｜${msg.role}
          </div>
          <div style="font-size:13px;color:#374151;line-height:1.6;">${msg.message}</div>
        </td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <!-- ヘッダー -->
    <div style="background:linear-gradient(135deg,#1a2f4e,#312e81);padding:24px 28px;">
      <div style="font-size:12px;color:#a5b4fc;margin-bottom:4px;">🏢 Careo 幹部会議レポート</div>
      <div style="font-size:20px;font-weight:700;color:#fff;">${result.topic}</div>
      <div style="font-size:12px;color:#818cf8;margin-top:6px;">${sessionLabel} · 当番: ${result.topicOwner}</div>
    </div>

    <!-- 推奨アクション -->
    <div style="padding:20px 28px;background:#eef2ff;border-bottom:3px solid #4f46e5;">
      <div style="font-size:11px;font-weight:700;color:#4f46e5;letter-spacing:0.05em;margin-bottom:6px;">✅ 推奨アクション（Goサイン待ち）</div>
      <div style="font-size:15px;font-weight:700;color:#1e1b4b;line-height:1.5;">→ ${result.recommendedAction}</div>
    </div>

    <!-- 議題提案 -->
    <div style="padding:20px 28px 0;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.05em;margin-bottom:8px;">📋 議題提案（${result.topicOwner}）</div>
      <div style="font-size:13px;color:#374151;line-height:1.7;background:#f9fafb;border-radius:8px;padding:12px 14px;">
        ${result.topicOwnerOpening}
      </div>
    </div>

    <!-- 議論 -->
    <div style="padding:20px 28px 0;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.05em;margin-bottom:8px;">💬 議論</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${discussionHtml}
      </table>
    </div>

    <!-- まとめ -->
    <div style="padding:20px 28px;">
      <div style="font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.05em;margin-bottom:8px;">📝 まとめ</div>
      <div style="font-size:13px;color:#374151;line-height:1.7;border-left:3px solid #4f46e5;padding-left:12px;">
        ${result.conclusion}
      </div>
    </div>

    <!-- フッター -->
    <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
      <div style="font-size:11px;color:#9ca3af;">Careo AI Board Meeting · 自動送信</div>
    </div>
  </div>
</body>
</html>`;
}

// Vercel Cron から呼ばれる（1日2回: 9時/21時 JST）
// vercel.json: "0 0 * * *" (9 AM JST) / "0 12 * * *" (9 PM JST)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const isEvening = now.getUTCHours() >= 12;
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000
    );
    const sessionIndex = dayOfYear * 2 + (isEvening ? 1 : 0);
    const sessionLabel = isEvening ? "夜21時" : "朝9時";

    const result = await runMeeting(sessionIndex);

    // Supabaseに保存
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: dbError } = await supabase.from("board_meetings").insert({
      session_index: sessionIndex,
      topic_owner: result.topicOwner,
      topic: result.topic,
      topic_owner_opening: result.topicOwnerOpening,
      discussion: result.discussion,
      conclusion: result.conclusion,
      recommended_action: result.recommendedAction,
      status: "pending",
    });

    if (dbError) {
      console.error("[board-meeting] db error:", dbError);
    }

    // メール送信
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: mailError } = await resend.emails.send({
      from: "Careo幹部会議 <onboarding@resend.dev>",
      to: FOUNDER_EMAIL,
      subject: `🏢 幹部会議 ${sessionLabel}｜${result.topic}`,
      html: buildEmailHtml(result, sessionLabel),
    });

    if (mailError) {
      console.error("[board-meeting] mail error:", mailError);
    }

    // Slack通知
    const { postToSlack } = await import("@/lib/slack/client");
    await postToSlack({
      text: `🏢 *幹部会議レポート（${sessionLabel}）*\n\n*議題：* ${result.topic}\n*当番：* ${result.topicOwner}\n\n*推奨アクション*\n→ ${result.recommendedAction}\n\n*まとめ*\n${result.conclusion}\n\n_詳細は /honbu で確認できます_`,
      username: "Careo本部",
      icon_emoji: ":office:",
    }).catch(() => {});

    console.log(`[board-meeting] session ${sessionIndex} by ${result.topicOwner}: ${result.topic}`);
    return NextResponse.json({ success: true, topic: result.topic, owner: result.topicOwner });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[board-meeting] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
