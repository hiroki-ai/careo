/**
 * 大学別LP用データ。SEO的に大学名×就活で流入を狙う。
 * 新しい大学は slug とデータを追加するだけで自動的にページが生成される。
 */

export interface UniversityLp {
  slug: string;       // URL用（英字）
  name: string;       // 表示名
  shortName: string;  // 短い呼称
  famousAlumni?: string[];
  strongIndustries: string[];
  typicalPath: string;
  challenges: string[];
  careoTips: string[];
}

export const UNIVERSITY_LPS: UniversityLp[] = [
  {
    slug: "sophia",
    name: "上智大学",
    shortName: "上智",
    strongIndustries: ["外資系", "総合商社", "マスコミ", "金融"],
    typicalPath: "語学力を活かした外資・商社・メーカー国際系への進路が多い。早期から動き出すトップ層と、3年秋以降に本格化する層に二極化。",
    challenges: ["語学力は強いが『で、何ができる？』に返せない", "外資志望が多く競争が激しい", "先輩の就活データが学内で共有されにくい"],
    careoTips: ["早期選考に備えてサマーインターンから全て Careo にログ化", "業界別勝率を可視化して外資・商社・メーカーの並行管理", "先輩データ(/senpai)で過去の通過ESを参考にする"],
  },
  {
    slug: "waseda",
    name: "早稲田大学",
    shortName: "早稲田",
    strongIndustries: ["総合商社", "金融", "コンサル", "マスコミ", "IT"],
    typicalPath: "人数が多く、強いコミュニティが就活に活きる。政経・商・法から金融・コンサル・商社への王道ルートが強い。",
    challenges: ["人数が多いので自分が埋もれる", "学内の就活情報が多すぎて整理しきれない", "サークル内で就活が話題になるタイミングが早い"],
    careoTips: ["自分のパイプラインを可視化して埋もれない就活を", "先輩・同期の情報と自分のデータを分けて管理", "KPIダッシュボードで『みんなに流されない』判断軸を持つ"],
  },
  {
    slug: "keio",
    name: "慶應義塾大学",
    shortName: "慶應",
    strongIndustries: ["金融", "コンサル", "総合商社", "外資", "IT"],
    typicalPath: "伝統的に金融・商社・コンサルに強い。OB/OGネットワークが強力で、リク面・OB訪問ルートが効く。",
    challenges: ["OB訪問が早く動けないと機会損失", "体育会系 vs サークル系の格差", "『慶應クオリティ』へのプレッシャー"],
    careoTips: ["OB訪問ログを徹底して、気づきを自己分析に反映", "業界別勝率で自分の本当の強みを客観視", "内定比較機能で複数内定時の判断を合理化"],
  },
  {
    slug: "todai",
    name: "東京大学",
    shortName: "東大",
    strongIndustries: ["外資コンサル", "外資金融", "官公庁", "商社", "総合コンサル", "IT"],
    typicalPath: "コンサル・外資・官公庁志望が多い。ケース面接の準備が重要で、特定の選考ルートに集中する。",
    challenges: ["『東大だから受かる』思い込み", "ケース面接の対策が独学だと限界", "専門を活かす or 汎用的なビジネス職かの選択"],
    careoTips: ["ケース面接の質問を Careo にログ化して型を作る", "コンサル・金融・商社の並行管理を KPI で", "自己分析で『東大×何』を言語化"],
  },
  {
    slug: "hitotsubashi",
    name: "一橋大学",
    shortName: "一橋",
    strongIndustries: ["総合商社", "金融", "コンサル"],
    typicalPath: "商学・経済出身者の金融・商社志望が伝統的に強い。少人数で学内の情報交換が活発。",
    challenges: ["志望業界が狭く競争が激しい", "『一橋で外れ扱いの業界』に行きづらい空気", "少人数ゆえの情報の偏り"],
    careoTips: ["志望業界を広げる業界別勝率チェック", "先輩データで隠れた優良企業を発掘", "PDCA で選考の客観的な課題分析"],
  },
  {
    slug: "meiji",
    name: "明治大学",
    shortName: "明治",
    strongIndustries: ["メーカー", "金融", "IT", "広告", "総合商社"],
    typicalPath: "MARCHの中でも人数が多く、幅広い業界に進む。早慶に次ぐ選考枠がある企業も多い。",
    challenges: ["『MARCH』と一括りされる壁", "上位層と中位層の差が大きい", "サークル・ゼミの就活情報に偏りあり"],
    careoTips: ["学歴フィルター以外の自分の強みを言語化", "KPI で『MARCH内での自分の立ち位置』を客観視", "先輩データで通過ESパターンを学習"],
  },
  {
    slug: "aoyama",
    name: "青山学院大学",
    shortName: "青学",
    strongIndustries: ["マスコミ", "広告", "アパレル", "IT", "航空"],
    typicalPath: "マスコミ・広告・エアライン等のクリエイティブ/サービス系に強い。英語力を活かした外資志望も多い。",
    challenges: ["『青学なら余裕』と思われがち", "志望業界が狭く倍率が高い", "メーカー・金融等の『堅い』業界ルート情報が少ない"],
    careoTips: ["狭き門の業界に対して複数社並行管理は必須", "エアライン・広告特化の対策を面接ログで蓄積", "内定比較でクリエイティブ軸 vs 安定軸の整理"],
  },
  {
    slug: "rikkyo",
    name: "立教大学",
    shortName: "立教",
    strongIndustries: ["メーカー", "広告", "IT", "金融", "マスコミ"],
    typicalPath: "MARCHの中でも自由な校風で多様な業界へ進む。インターン参加率が高い傾向。",
    challenges: ["MARCH内でも立ち位置が曖昧", "自由度が高すぎて軸が定まらない層", "早期選考への動き出しが遅いことがある"],
    careoTips: ["自己分析からスタートして軸を早期に確立", "サマーインターンを Careo で徹底管理", "PDCA で就活の進捗を毎週振り返り"],
  },
  {
    slug: "chuo",
    name: "中央大学",
    shortName: "中央",
    strongIndustries: ["法律系", "金融", "公務員", "メーカー"],
    typicalPath: "法学部の司法・公務員ルートが有名。商学・経済は金融・メーカー系に進む学生が多い。",
    challenges: ["司法試験ルートと就活ルートの両立", "多摩キャンパスからの就活は物理的負担大", "伝統的な業界に偏りがち"],
    careoTips: ["公務員・民間の並行管理を KPI で", "先輩の公務員→民間転換パターンを /senpai で学習", "移動時間の多さを Careo モバイルで活用"],
  },
  {
    slug: "hosei",
    name: "法政大学",
    shortName: "法政",
    strongIndustries: ["メーカー", "金融", "IT", "サービス"],
    typicalPath: "MARCH最下位という先入観と戦いながら、実力で内定を取る学生も多い。自己PRの設計が特に重要。",
    challenges: ["学歴フィルターで最初に弾かれる不安", "自己PRで『なぜ法政で』を求められる", "就活情報のネットワークが弱い"],
    careoTips: ["自己PR・ガクチカの質を徹底的に磨く", "Careo のES添削(ChatGPT連携)で表現力UP", "複数内定で比較する判断力を鍛える"],
  },
];

export function getUniversityLp(slug: string): UniversityLp | null {
  return UNIVERSITY_LPS.find((u) => u.slug === slug) ?? null;
}
