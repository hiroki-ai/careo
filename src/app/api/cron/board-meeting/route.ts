import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runMeeting } from "@/lib/board/runMeeting";

// Vercel Cron から呼ばれる（1日2回: 9時/21時 JST）
// vercel.json: "0 0 * * *" (9 AM JST) / "0 12 * * *" (9 PM JST)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // セッションインデックス: 1日2回なので日付ベースで計算
    const now = new Date();
    const isEvening = now.getUTCHours() >= 12; // UTC 12時以降 = JST 21時
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getUTCFullYear(), 0, 0).getTime()) / 86400000
    );
    const sessionIndex = dayOfYear * 2 + (isEvening ? 1 : 0);

    const result = await runMeeting(sessionIndex);

    // Supabaseに保存（RLS無効のboard_meetingsテーブルへ）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from("board_meetings").insert({
      session_index: sessionIndex,
      topic_owner: result.topicOwner,
      topic: result.topic,
      topic_owner_opening: result.topicOwnerOpening,
      discussion: result.discussion,
      conclusion: result.conclusion,
      recommended_action: result.recommendedAction,
      status: "pending",
    });

    if (error) {
      console.error("[board-meeting] db error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[board-meeting] session ${sessionIndex} by ${result.topicOwner}: ${result.topic}`);
    return NextResponse.json({ success: true, topic: result.topic, owner: result.topicOwner });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[board-meeting] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
