import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const supabase = getSupabase();

  const [meetingsRes, reportsRes] = await Promise.all([
    supabase
      .from("board_meetings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("team_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  return NextResponse.json({
    meetings: meetingsRes.data ?? [],
    teamReports: reportsRes.data ?? [],
  });
}
