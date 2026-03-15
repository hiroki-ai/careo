/**
 * カレオの返答から [追加候補: 企業名1, 企業名2] タグを解析する
 */
export function parseCompanySuggestions(text: string): { display: string; companies: string[] } {
  const match = text.match(/\[追加候補:\s*([^\]]+)\]/);
  if (!match) return { display: text, companies: [] };

  const companies = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // タグ部分を表示テキストから除去
  const display = text.replace(/\n?\[追加候補:[^\]]*\]/, "").trimEnd();

  return { display, companies };
}
