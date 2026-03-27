import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(200, "タイトルは200文字以内で入力してください"),
  body: z.string().min(1, "本文は必須です").max(5000, "本文は5000文字以内で入力してください"),
  targetGrade: z.string().max(20).nullable().optional(),
  targetGradYear: z.number().int().min(2020).max(2040).nullable().optional(),
});

export async function GET() {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_center_announcements")
    .select("*")
    .eq("university", staff.university)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const announcements = (data ?? []).map((a) => ({
    id: a.id,
    staffId: a.staff_id,
    university: a.university,
    title: a.title,
    body: a.body,
    targetGrade: a.target_grade ?? null,
    targetGradYear: a.target_grad_year ?? null,
    isPublished: a.is_published,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }));

  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const rawBody = await req.json();
  const result = announcementSchema.safeParse(rawBody);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "入力内容が正しくありません";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }
  const { title, body: msgBody, targetGrade, targetGradYear } = result.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_center_announcements")
    .insert({
      staff_id: staff.id,
      university: staff.university,
      title: title.trim(),
      body: msgBody.trim(),
      target_grade: targetGrade ?? null,
      target_grad_year: targetGradYear ?? null,
      is_published: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    announcement: {
      id: data.id,
      staffId: data.staff_id,
      university: data.university,
      title: data.title,
      body: data.body,
      targetGrade: data.target_grade,
      targetGradYear: data.target_grad_year,
      isPublished: data.is_published,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id が必要です" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("career_center_announcements")
    .delete()
    .eq("id", id)
    .eq("university", staff.university);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
