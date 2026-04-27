import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, fetchGoogleUserEmail, saveCredentials } from "@/lib/google/oauth";

export const runtime = "nodejs";

/** GET /api/auth/google/callback?code=xxx&state=yyy */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieState = req.cookies.get("google_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(error)}`, req.url));
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/settings/integrations?error=invalid_state", req.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // state内のuser_idと突き合わせ
  const stateUserId = state.split(":")[1];
  if (stateUserId !== user.id) {
    return NextResponse.redirect(new URL("/settings/integrations?error=user_mismatch", req.url));
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/settings/integrations?error=no_refresh_token", req.url));
    }
    const email = await fetchGoogleUserEmail(tokens.access_token);
    await saveCredentials({
      userId: user.id,
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
    const res = NextResponse.redirect(new URL("/settings/integrations?connected=1", req.url));
    res.cookies.delete("google_oauth_state");
    return res;
  } catch (err) {
    console.error("[google/callback]", err);
    return NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(String(err))}`, req.url));
  }
}
