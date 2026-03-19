import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runTeamTask } from "@/lib/team/runTeamTask";
import { TEAM_MEMBERS } from "@/lib/team/members";
import { createClient as createServerClient } from "@/lib/supabase/server";

async function isAdmin(): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: 全メンバーの最新レポートを返す
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json([], { status: 401 });
  const supabase = getSupabase();

  const results = await Promise.all(
    TEAM_MEMBERS.map(async (member) => {
      const { data } = await supabase
        .from("team_reports")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { member, report: data ?? null };
    })
  );

  return NextResponse.json(results);
}

// POST: 特定メンバーのタスクを実行して保存
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  try {
    const result = await runTeamTask(memberId);
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("team_reports")
      .insert({
        member_id: result.memberId,
        member_name: result.memberName,
        task_type: result.taskType,
        headline: result.headline,
        body: result.body,
        deliverable: result.deliverable,
        action_label: result.actionLabel,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: 採用 or スキップ
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json();
  if (!id || !["adopted", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("team_reports")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
