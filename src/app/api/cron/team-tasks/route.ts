import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runTeamTask } from "@/lib/team/runTeamTask";
import { TEAM_MEMBERS } from "@/lib/team/members";

// Vercel Cron: 毎朝8時 JST (UTC 23:00前日) に全メンバーのタスクを自動生成
// vercel.json: { "crons": [{ "path": "/api/cron/team-tasks", "schedule": "0 23 * * *" }] }
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const results: { member: string; success: boolean; headline?: string }[] = [];

  for (const member of TEAM_MEMBERS) {
    try {
      const result = await runTeamTask(member.id);
      const { error } = await supabase.from("team_reports").insert({
        member_id: result.memberId,
        member_name: result.memberName,
        task_type: result.taskType,
        headline: result.headline,
        body: result.body,
        deliverable: result.deliverable,
        action_label: result.actionLabel,
        status: "pending",
      });

      if (error) {
        console.error(`[team-tasks] ${member.id} db error:`, error);
        results.push({ member: member.id, success: false });
      } else {
        console.log(`[team-tasks] ${member.id}: ${result.headline}`);
        results.push({ member: member.id, success: true, headline: result.headline });
      }
    } catch (err) {
      console.error(`[team-tasks] ${member.id} error:`, err);
      results.push({ member: member.id, success: false });
    }
  }

  return NextResponse.json({ success: true, results });
}
