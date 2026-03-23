import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/apiAuth";

export async function DELETE() {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ユーザーデータを先に削除（RLSで保護されているのでadmin経由で直接削除）
  const tables = [
    "companies",
    "es",
    "interviews",
    "ob_visits",
    "aptitude_tests",
    "chat_messages",
    "push_subscriptions",
    "user_profiles",
  ];
  for (const table of tables) {
    await admin.from(table).delete().eq("user_id", user.id);
  }

  // auth.users から削除
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "アカウントの削除に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
