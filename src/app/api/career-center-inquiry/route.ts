import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, university, message } = await req.json();

  if (!name || !email || !university || !message) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }

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
  const { error: mailError } = await resend.emails.send({
    from: "Careo お問い合わせ <onboarding@resend.dev>",
    to: ["hiroki.a0625@gmail.com"],
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
