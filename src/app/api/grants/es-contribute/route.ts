import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { applyProGrant } from "@/lib/proGrants";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

/**
 * ESを匿名で提供 → Pro 30日間 付与（1ユーザー1回限り）
 *
 * body: { esId: string }
 * - 指定 ES が本人のもので、提出済み（SUBMITTED）かを検証
 * - es_entries.is_shared_anonymously = true に更新
 * - pro_grants に "es_contribute" を記録
 * - plan_period_end を +30日 延長
 *
 * 「売らない宣言」との整合: 提供されたESはCareoユーザー間（29卒共有プール・公開添削チャレンジ）でのみ
 * 利用される。広告主・人材会社には絶対に渡さない。
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { esId } = await req.json() as { esId?: string };
  if (!esId) {
    return NextResponse.json({ error: "esId が必要です" }, { status: 400 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 本人の提出済みESかチェック
  const { data: es } = await sb
    .from("es_entries")
    .select("id, user_id, status, is_shared_anonymously")
    .eq("id", esId)
    .single();

  if (!es || es.user_id !== user.id) {
    return NextResponse.json({ error: "ESが見つかりません" }, { status: 404 });
  }
  if (es.status !== "SUBMITTED") {
    return NextResponse.json({
      error: "提出済みのESのみ提供できます",
    }, { status: 400 });
  }

  // 提供フラグを立てる
  if (!es.is_shared_anonymously) {
    await sb
      .from("es_entries")
      .update({ is_shared_anonymously: true })
      .eq("id", esId);
  }

  const grant = await applyProGrant(user.id, "es_contribute", 30);
  if (!grant.success) {
    return NextResponse.json({
      error: grant.error ?? "付与に失敗しました",
      alreadyClaimed: grant.alreadyClaimed,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "ESを匿名提供しました。Pro 30日間が付与されました 🎉",
    newPeriodEnd: grant.newPeriodEnd,
  });
}
