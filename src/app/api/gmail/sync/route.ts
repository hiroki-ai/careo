import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getValidAccessToken } from "@/lib/google/oauth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GmailMessageHeader { name: string; value: string }
interface GmailMessage {
  id: string;
  threadId: string;
  internalDate: string;
  snippet: string;
  payload: { headers: GmailMessageHeader[] };
}

function header(headers: GmailMessageHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractDomain(fromHeader: string): string {
  const m = fromHeader.match(/<([^>]+)>/);
  const email = m ? m[1] : fromHeader.trim();
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

function extractEmail(fromHeader: string): string {
  const m = fromHeader.match(/<([^>]+)>/);
  return m ? m[1] : fromHeader.trim();
}

/** POST /api/gmail/sync : 直近N日のメールを取得して仕分け */
export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(getClientIp(req), "gmail-sync");
  if (!allowed) return NextResponse.json({ error: "rate_limit" }, { status: 429 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tokens = await getValidAccessToken(user.id);
  if (!tokens) return NextResponse.json({ error: "not_connected" }, { status: 400 });

  // 直近30日の受信メール（最大50件）
  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(`after:${since} -category:promotions -category:social`)}&maxResults=50`;
  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
  if (!listRes.ok) {
    return NextResponse.json({ error: "gmail_list_failed", detail: await listRes.text() }, { status: 502 });
  }
  const listData = (await listRes.json()) as { messages?: { id: string; threadId: string }[] };
  const ids = listData.messages?.map((m) => m.id) ?? [];

  // 企業マスタを取得（マッチング用）
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: companies } = await service
    .from("companies")
    .select("id, name, url")
    .eq("user_id", user.id);
  const { data: hints } = await service
    .from("company_domain_hints")
    .select("company_id, domain")
    .eq("user_id", user.id);

  const domainToCompanyId = new Map<string, string>();
  hints?.forEach((h) => domainToCompanyId.set(h.domain.toLowerCase(), h.company_id));
  companies?.forEach((c) => {
    if (c.url) {
      try {
        const u = new URL(c.url);
        const host = u.hostname.replace(/^www\./, "").toLowerCase();
        if (!domainToCompanyId.has(host)) domainToCompanyId.set(host, c.id);
      } catch { /* ignore */ }
    }
  });

  // 各メッセージの詳細を取得 → email_threads に upsert
  let saved = 0;
  for (const id of ids) {
    const detailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
    );
    if (!detailRes.ok) continue;
    const msg = (await detailRes.json()) as GmailMessage;
    const fromHeader = header(msg.payload.headers, "From");
    const subject = header(msg.payload.headers, "Subject");
    const fromAddress = extractEmail(fromHeader);
    const fromDomain = extractDomain(fromHeader);

    // ドメインで企業マッチング（rootドメインも試す）
    let companyId: string | null = domainToCompanyId.get(fromDomain) ?? null;
    if (!companyId) {
      const parts = fromDomain.split(".");
      if (parts.length > 2) {
        const root = parts.slice(-2).join(".");
        companyId = domainToCompanyId.get(root) ?? null;
      }
    }

    const matchedCompanyName = companyId
      ? companies?.find((c) => c.id === companyId)?.name ?? null
      : null;

    const receivedAt = new Date(parseInt(msg.internalDate, 10)).toISOString();

    await service.from("email_threads").upsert(
      {
        user_id: user.id,
        gmail_thread_id: msg.threadId,
        company_id: companyId,
        matched_company_name: matchedCompanyName,
        subject,
        from_address: fromAddress,
        from_domain: fromDomain,
        snippet: msg.snippet,
        received_at: receivedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,gmail_thread_id" },
    );
    saved++;
  }

  await service
    .from("gmail_credentials")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, fetched: ids.length, saved });
}

/** GET: ステータス */
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "POST to sync" });
}
