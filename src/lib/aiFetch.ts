/**
 * AIルート呼び出し用の共通fetchラッパー。
 * 402（制限超過）のレスポンスを検出したら、onLimitExceeded コールバックを呼ぶ。
 */

export interface AiFetchOptions<T> {
  /** 402 が返ってきた時に呼ばれる。通常はトースト＋アップグレード誘導 */
  onLimitExceeded?: (data: { error: string; feature?: string; limit?: number }) => void;
  /** 4xx/5xx エラー時に呼ばれる（402を除く） */
  onError?: (status: number, message?: string) => void;
  /** 成功時の型パーサ */
  parse?: (data: unknown) => T;
}

export interface AiFetchResult<T> {
  status: "success" | "limit_exceeded" | "error";
  data?: T;
  statusCode?: number;
}

export async function aiFetch<T = unknown>(
  url: string,
  body: unknown,
  opts: AiFetchOptions<T> = {}
): Promise<AiFetchResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 402) {
      const data = await res.json().catch(() => ({ error: "今月の無料枠を使い切りました" }));
      opts.onLimitExceeded?.(data);
      return { status: "limit_exceeded", statusCode: 402 };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      opts.onError?.(res.status, data.error);
      return { status: "error", statusCode: res.status };
    }

    const raw = await res.json();
    const parsed = opts.parse ? opts.parse(raw) : (raw as T);
    return { status: "success", data: parsed, statusCode: 200 };
  } catch (err) {
    opts.onError?.(0, err instanceof Error ? err.message : "通信エラー");
    return { status: "error" };
  }
}
