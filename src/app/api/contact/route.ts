import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const CATEGORIES: Record<string, string> = {
  feature: "機能要望",
  bug: "バグ報告",
  question: "質問・相談",
  other: "その他",
};

const contactSchema = z.object({
  name: z.string().min(1, "お名前は必須です").max(100),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  category: z.enum(["feature", "bug", "question", "other"]).optional(),
  message: z.string().min(1, "メッセージは必須です").max(2000, "メッセージは2000文字以内で入力してください"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = contactSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? "入力内容が正しくありません";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }
  const { name, email, category, message } = result.data;

  const categoryLabel = CATEGORIES[category ?? "other"] ?? "その他";
  const contactEmail = process.env.CONTACT_EMAIL ?? process.env.ADMIN_EMAIL;

  const { error } = await resend.emails.send({
    from: "Careo お問い合わせ <onboarding@resend.dev>",
    to: contactEmail ? [contactEmail] : [],
    replyTo: email,
    subject: `[Careo お問い合わせ] ${categoryLabel}｜${name}`,
    text: `【Careo お問い合わせ】\n\nカテゴリ: ${categoryLabel}\nお名前: ${name}\nメールアドレス: ${email}\n\n【メッセージ】\n${message}`,
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    return NextResponse.json({ error: "送信に失敗しました。しばらく経ってから再度お試しください。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
