import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // 'pending'|'ai_done'|'staff_done'|'closed'

  const supabase = await createClient();
  let query = supabase
    .from("es_review_requests")
    .select("id, student_user_id, company_name, status, ai_generated_at, staff_feedback, created_at, ai_comment, es_snapshot, student_message")
    .eq("university", staff.university)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: data ?? [] });
}
