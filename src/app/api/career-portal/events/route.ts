import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_center_events")
    .select("*")
    .eq("university", staff.university)
    .order("held_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    events: (data ?? []).map((e) => ({
      id: e.id,
      staffId: e.staff_id,
      title: e.title,
      eventType: e.event_type,
      heldAt: e.held_at,
      description: e.description,
      createdAt: e.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const { title, eventType, heldAt, description } = await req.json();
  if (!title || !heldAt) {
    return NextResponse.json({ error: "title と heldAt が必要です" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_center_events")
    .insert({
      staff_id: staff.id,
      university: staff.university,
      title,
      event_type: eventType ?? "guidance",
      held_at: heldAt,
      description: description ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    event: {
      id: data.id,
      title: data.title,
      eventType: data.event_type,
      heldAt: data.held_at,
      description: data.description,
      createdAt: data.created_at,
    },
  });
}
