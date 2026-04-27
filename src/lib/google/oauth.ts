/**
 * Google OAuth ユーティリティ（Gmail readonly スコープ）
 * googleapisパッケージは使わずfetchで直接OAuth/Gmail APIを叩く
 */

import { createClient as createServiceClient } from "@supabase/supabase-js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export function getOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("GOOGLE_OAUTH_* env vars not configured");
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: `${GMAIL_SCOPE} email profile`,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getOAuthConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${await res.text()}`);
  return res.json();
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("failed to fetch userinfo");
  const data = (await res.json()) as { email: string };
  return data.email;
}

/** サービスロールでgmail_credentialsをupsert */
export async function saveCredentials(params: {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString();
  const { error } = await supabase.from("gmail_credentials").upsert(
    {
      user_id: params.userId,
      email: params.email,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      token_expires_at: expiresAt,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/** トークンをロード、必要ならrefresh */
export async function getValidAccessToken(userId: string): Promise<{ accessToken: string; email: string } | null> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await supabase
    .from("gmail_credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;

  const expiresAt = data.token_expires_at ? new Date(data.token_expires_at).getTime() : 0;
  const now = Date.now();
  if (data.access_token && expiresAt > now + 60_000) {
    return { accessToken: data.access_token, email: data.email };
  }

  if (!data.refresh_token) return null;
  const refreshed = await refreshAccessToken(data.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabase
    .from("gmail_credentials")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  return { accessToken: refreshed.access_token, email: data.email };
}
