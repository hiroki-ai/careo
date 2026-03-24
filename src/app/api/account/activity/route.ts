import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

// last_active_at を更新（孤立学生アラート用）
export async function POST() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const supabase = await createClient();
  await supabase
    .from("user_profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
