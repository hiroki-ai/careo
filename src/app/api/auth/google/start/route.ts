import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/google/oauth";
import crypto from "crypto";

export const runtime = "nodejs";

/** GET /api/auth/google/start → Google OAuth 同意画面へリダイレクト */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const state = crypto.randomBytes(16).toString("hex") + ":" + user.id;
    const url = buildAuthUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set("google_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: "oauth_not_configured", detail: String(err) }, { status: 500 });
  }
}
