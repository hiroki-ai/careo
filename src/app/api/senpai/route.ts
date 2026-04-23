import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 15;

/**
 * 先輩の匿名共有データを取得。
 * クエリ:
 *   ?type=es|interviews|summary
 *   ?company=...
 *   ?industry=...
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;
  void user;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "summary";
  const company = url.searchParams.get("company");
  const industry = url.searchParams.get("industry");

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (type === "summary") {
    const { data, error } = await supabase.rpc("get_senpai_companies_summary", { p_limit: 50 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ summary: data ?? [] });
  }

  if (type === "es") {
    const { data, error } = await supabase.rpc("get_senpai_es", {
      p_company_name: company,
      p_industry: industry,
      p_limit: 30,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ es: data ?? [] });
  }

  if (type === "interviews") {
    const { data, error } = await supabase.rpc("get_senpai_interviews", {
      p_company_name: company,
      p_industry: industry,
      p_limit: 30,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ interviews: data ?? [] });
  }

  return NextResponse.json({ error: "type must be es|interviews|summary" }, { status: 400 });
}
