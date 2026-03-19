import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
