import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const inquirySchema = z.object({
  name: z.string().min(1, "お名前は必須です").max(100, "お名前は100文字以内で入力してください"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  university: z.string().min(1, "大学名は必須です").max(100, "大学名は100文字以内で入力してください"),
  message: z.string().min(1, "メッセージは必須です").max(3000, "メッセージは3000文字以内で入力してください"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = inquirySchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "入力内容が正しくありません";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }
  const { name, email, university, message } = result.data;

  // Supabaseに保存
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error: dbError } = await supabase
    .from("career_center_inquiries")
    .insert({ name, email, university, message });

  if (dbError) {
    console.error("[career-center-inquiry] DB error:", dbError);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }

  // メール通知
  const contactEmail = process.env.CONTACT_EMAIL ?? process.env.ADMIN_EMAIL;
  if (!contactEmail) {
    console.error("[career-center-inquiry] CONTACT_EMAIL not set");
  }
  const { error: mailError } = await resend.emails.send({
    from: "Careo お問い合わせ <onboarding@resend.dev>",
    to: contactEmail ? [contactEmail] : [],
    replyTo: email,
    subject: `[Careo キャリアセンター] ${university}｜${name}`,
    text: `【キャリアセンター お問い合わせ】\n\nお名前: ${name}\nメール: ${email}\n大学名: ${university}\n\n【メッセージ】\n${message}`,
  });

  if (mailError) {
    console.error("[career-center-inquiry] Resend error:", mailError);
    // DB保存は成功しているのでエラーにしない
  }

  return NextResponse.json({ ok: true });
}
