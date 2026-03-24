import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const url = new URL(req.url);
  const resolved = url.searchParams.get("resolved") === "true";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_center_alerts")
    .select("*")
    .eq("university", staff.university)
    .eq("is_resolved", resolved)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const alerts = (data ?? []).map((a) => ({
    id: a.id,
    university: a.university,
    studentUserId: a.student_user_id,
    alertType: a.alert_type,
    alertDetail: a.alert_detail,
    isResolved: a.is_resolved,
    resolvedBy: a.resolved_by,
    resolvedAt: a.resolved_at,
    createdAt: a.created_at,
  }));

  return NextResponse.json({ alerts });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const { alertId } = await req.json();
  if (!alertId) return NextResponse.json({ error: "alertId が必要です" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("career_center_alerts")
    .update({
      is_resolved: true,
      resolved_by: staff.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId)
    .eq("university", staff.university);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
