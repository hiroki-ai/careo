import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const CATEGORIES: Record<string, string> = {
  feature: "機能要望",
  bug: "バグ報告",
  question: "質問・相談",
  other: "その他",
};

export async function POST(req: NextRequest) {
  const { name, email, category, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: "メッセージは2000文字以内で入力してください" }, { status: 400 });
  }

  const categoryLabel = CATEGORIES[category] ?? "その他";

  const { error } = await resend.emails.send({
    from: "Careo お問い合わせ <onboarding@resend.dev>",
    to: ["hiroki.a0625@gmail.com"],
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
