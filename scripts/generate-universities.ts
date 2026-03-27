/**
 * 大学・学部・学科データを Claude API で一括生成して universities.ts を更新するスクリプト
 *
 * 実行方法:
 *   npx tsx scripts/generate-universities.ts
 *
 * 環境変数:
 *   ANTHROPIC_API_KEY が必要（.env.local から自動読み込み）
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

// .env.local を読み込む
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ========== 対象大学リスト（約200校）==========
const TARGET_UNIVERSITIES = [
  // 旧帝大
  "東京大学", "京都大学", "大阪大学", "名古屋大学", "東北大学",
  "九州大学", "北海道大学",
  // 国公立（関東）
  "一橋大学", "東京工業大学", "筑波大学", "横浜国立大学", "千葉大学",
  "埼玉大学", "東京外国語大学", "東京農工大学", "電気通信大学", "東京海洋大学",
  "首都大学東京", "横浜市立大学", "東京都立大学",
  // 国公立（関西）
  "神戸大学", "大阪公立大学", "京都工芸繊維大学",
  "大阪教育大学", "奈良女子大学", "和歌山大学",
  // 国公立（中部）
  "名古屋工業大学", "静岡大学", "金沢大学", "富山大学", "信州大学",
  "岐阜大学",
  // 国公立（その他）
  "広島大学", "岡山大学", "熊本大学", "新潟大学", "長崎大学",
  "鹿児島大学", "琉球大学", "岩手大学", "弘前大学", "山形大学",
  // 早慶上理
  "早稲田大学", "慶應義塾大学", "上智大学", "東京理科大学",
  // MARCH
  "明治大学", "青山学院大学", "立教大学", "中央大学", "法政大学",
  // 学習院・ICU
  "学習院大学", "国際基督教大学",
  // 関関同立
  "関西大学", "関西学院大学", "同志社大学", "立命館大学",
  // 産近甲龍
  "京都産業大学", "近畿大学", "甲南大学", "龍谷大学",
  // 日東駒専
  "日本大学", "東洋大学", "駒澤大学", "専修大学",
  // 大東亜帝国
  "大東文化大学", "東海大学", "亜細亜大学", "帝京大学", "国士舘大学",
  // 摂神追桃
  "摂南大学", "神戸学院大学", "追手門学院大学", "桃山学院大学",
  // 女子大
  "津田塾大学", "東京女子大学", "日本女子大学", "お茶の水女子大学",
  "聖心女子大学", "共立女子大学", "昭和女子大学", "東洋英和女学院大学",
  "フェリス女学院大学", "神戸女学院大学", "同志社女子大学",
  // 理系
  "東京電機大学", "芝浦工業大学", "東京都市大学", "工学院大学",
  "日本工業大学", "千葉工業大学", "北里大学", "東邦大学",
  "武蔵野大学", "東京薬科大学",
  // その他私立（有力）
  "成蹊大学", "成城大学", "明治学院大学", "武蔵大学", "國學院大學",
  "獨協大学", "神奈川大学", "東京農業大学", "拓殖大学", "文教大学",
  "桜美林大学", "帝京平成大学", "東京国際大学",
  "福岡大学", "西南学院大学", "広島修道大学", "松山大学",
  "南山大学", "名城大学", "中京大学", "愛知大学",
  "立命館アジア太平洋大学",
  // 有名美術・音楽系
  "多摩美術大学", "武蔵野美術大学", "東京藝術大学",
  "東京音楽大学", "昭和音楽大学",
  // 体育・スポーツ系
  "日本体育大学", "順天堂大学", "筑波技術大学",
  // 国際・外語系
  "神田外語大学", "関西外国語大学", "京都外国語大学", "名古屋外国語大学",
  // 経済・ビジネス系
  "一橋大学", "横浜商科大学",
];

// 重複除去
const UNIVERSITIES_TO_FETCH = [...new Set(TARGET_UNIVERSITIES)];

// ========== 既存データ（学科まで入力済みのものはスキップ）==========
const SKIP_IF_HAS_DEPARTMENTS = [
  "上智大学", // 既に学科データあり
];

// ========== API呼び出し ==========
async function fetchFaculties(
  university: string
): Promise<Record<string, string[]>> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `「${university}」の学部と学科の一覧を返してください。
日本語の正式名称で、以下のJSON形式で返してください。
学科が存在しない・不明な場合は空配列にしてください。
大学が存在しない・不明な場合は空オブジェクト {} を返してください。

形式例:
{"経済学部": ["経済学科", "経営学科"], "法学部": ["法律学科"]}

JSONのみ返し、説明文は不要です。`,
        },
      ],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  } catch (e) {
    console.error(`  ERROR: ${university}`, e);
    return {};
  }
}

// ========== 並列実行（同時5件）==========
async function processInBatches<T>(
  items: string[],
  batchSize: number,
  fn: (item: string) => Promise<T>
): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => ({ item, result: await fn(item) }))
    );
    for (const { item, result } of batchResults) {
      results.set(item, result);
    }
    console.log(`  進捗: ${Math.min(i + batchSize, items.length)} / ${items.length}`);
  }
  return results;
}

// ========== TypeScript形式で出力 ==========
function formatAsTypeScript(data: Record<string, Record<string, string[]>>): string {
  const lines: string[] = [
    "// 大学 → 学部 → 学科[] のマスタデータ",
    "// 学科が空配列の場合は学科選択なし（学部名のみ格納）",
    "// このファイルは scripts/generate-universities.ts で自動生成",
    "export type UniversityMap = Record<string, Record<string, string[]>>;",
    "",
    "export const UNIVERSITIES: UniversityMap = {",
  ];

  for (const [uni, faculties] of Object.entries(data)) {
    if (Object.keys(faculties).length === 0) continue;
    lines.push(`  "${uni}": {`);
    for (const [faculty, depts] of Object.entries(faculties)) {
      if (depts.length === 0) {
        lines.push(`    "${faculty}": [],`);
      } else {
        const deptsStr = depts.map((d) => `"${d}"`).join(", ");
        lines.push(`    "${faculty}": [${deptsStr}],`);
      }
    }
    lines.push("  },");
  }

  lines.push("};", "", "export const UNIVERSITY_NAMES = Object.keys(UNIVERSITIES);", "");
  return lines.join("\n");
}

// ========== メイン ==========
async function main() {
  console.log(`対象: ${UNIVERSITIES_TO_FETCH.length} 大学`);
  console.log("取得開始...\n");

  // スキップ対象を除外
  const toFetch = UNIVERSITIES_TO_FETCH.filter(
    (u) => !SKIP_IF_HAS_DEPARTMENTS.includes(u)
  );

  const results = await processInBatches(toFetch, 5, async (uni) => {
    process.stdout.write(`  取得中: ${uni}... `);
    const data = await fetchFaculties(uni);
    const count = Object.keys(data).length;
    process.stdout.write(`${count}学部\n`);
    return data;
  });

  // 上智大学の既存データを先頭に保持
  const finalData: Record<string, Record<string, string[]>> = {
    "上智大学": {
      "神学部": ["神学科"],
      "文学部": ["哲学科", "史学科", "国文学科", "英文学科", "ドイツ文学科", "フランス文学科", "新聞学科"],
      "総合人間科学部": ["教育学科", "心理学科", "社会学科", "社会福祉学科", "看護学科"],
      "法学部": ["法律学科", "国際関係法学科", "地球環境法学科"],
      "経済学部": ["経済学科", "経営学科"],
      "外国語学部": ["英語学科", "ドイツ語学科", "フランス語学科", "イスパニア語学科", "ロシア語学科", "ポルトガル語学科"],
      "総合グローバル学部": ["総合グローバル学科"],
      "国際教養学部": ["国際教養学科"],
      "理工学部": ["物質生命理工学科", "機能創造理工学科", "情報理工学科"],
    },
  };

  for (const [uni, faculties] of results.entries()) {
    if (Object.keys(faculties).length > 0) {
      finalData[uni] = faculties;
    }
  }

  const output = formatAsTypeScript(finalData);
  const outputPath = path.join(process.cwd(), "src/data/universities.ts");
  fs.writeFileSync(outputPath, output, "utf-8");

  console.log(`\n完了: ${Object.keys(finalData).length} 大学を src/data/universities.ts に書き出しました`);
}

main().catch(console.error);
