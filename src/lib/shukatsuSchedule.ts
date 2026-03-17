/**
 * 卒業年と現在日付から就活フェーズと適切なアドバイスを返すユーティリティ
 * 対応: 27卒〜30卒以降
 */

export interface ShukatsuContext {
  nendoLabel: string;       // "28卒" など
  phase: string;            // 現在のフェーズ名
  phaseDetail: string;      // フェーズの詳細説明
  schedule: string;         // 月別スケジュール全体
  currentAdvice: string;    // 今この時期にやるべきこと
  isInternPhase: boolean;   // true = インターン活動期（本選考前）
  offeredLabel: string;     // "インターン合格" or "内定"
  monthsUntil: number;      // 卒業まで何ヶ月
}

/**
 * 卒業年から就活フェーズを計算する
 * 卒業 = graduationYear年4月（日本の標準）
 * monthsUntil = 卒業まで何ヶ月か
 */
export function getShukatsuContext(graduationYear: number, now = new Date()): ShukatsuContext {
  const nendoLabel = `${graduationYear - 2000}卒`;

  // 卒業を graduationYear年4月1日 として計算
  const graduation = new Date(graduationYear, 3, 1); // month is 0-indexed
  const monthsUntil = Math.round(
    (graduation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  );

  // フェーズ判定
  // monthsUntil:
  //   > 36: 就活意識前（1年生相当）
  //   25-36: 超早期準備（2年生）
  //   19-24: 就活スタート・サマーインターン準備（3年4〜8月）
  //   13-18: 秋冬インターン・早期選考（3年9月〜2月）
  //   7-12: 本選考本番（4年3〜9月）
  //   1-6:  終盤・内定承諾（4年10月〜3月）
  //   <= 0: 就活終了

  let phase: string;
  let phaseDetail: string;
  let currentAdvice: string;

  if (monthsUntil > 36) {
    phase = "就活準備前";
    phaseDetail = "まだ就活本番まで時間があります。大学生活・スキルアップに集中する時期。";
    currentAdvice = `今できること: 長期インターンシップへの参加・資格取得・英語学習・自己分析の基礎固め。就活は${graduationYear - 2}年春から本格化します。`;
  } else if (monthsUntil > 24) {
    phase = "超早期準備期（2年生）";
    phaseDetail = "早期に動けば圧倒的に有利。長期インターンで実績を作る時期。";
    currentAdvice = `今すぐやること: 長期インターン応募・OB/OG訪問で業界理解・自己分析の開始・就活用メール作成。${graduationYear - 1}年の夏インターンに向けて準備を始めましょう。`;
  } else if (monthsUntil > 18) {
    phase = "就活スタート・サマーインターン準備（3年前半）";
    phaseDetail = "就活の本番スタート。サマーインターンへの応募が最重要。";
    currentAdvice = `今すぐやること: 就活用メール作成・証明写真・ワンキャリア/就活会議/マイナビ登録・ES作成（ガクチカ・自己PR）・SPI勉強開始・サマーインターンに60〜100社エントリー（1業界12〜20社×5業界が目安）・Webテスト練習必須。`;
  } else if (monthsUntil > 12) {
    phase = "秋冬インターン・早期選考期（3年後半）";
    phaseDetail = "早期選考ルートに乗れれば年内内定も可能な重要時期。";
    currentAdvice = `今すぐやること: 夏インターンの振り返り・冬インターンエントリー（本選考直結が多い）・早期選考エントリー・OB/OG訪問継続・業界の絞り込み・面接練習（逆質問・難質問のストックを貯める）。年内内定を狙うなら今が勝負。`;
  } else if (monthsUntil > 6) {
    phase = "本選考本番（4年前半）";
    phaseDetail = "就活の天王山。本選考エントリーと面接が最優先。";
    currentAdvice = `今すぐやること: 本選考エントリー（締切を絶対に確認）・企業分析・キャリアプラン整理・SPI/Webテスト（ラストチャンス）・面接練習の継続。就活の軸を一貫させることが志望動機の説得力につながります。就活生の6割以上が4月に内定を得ます。`;
  } else if (monthsUntil > 0) {
    phase = "内定承諾・就活終盤";
    phaseDetail = "内定が出始める時期。承諾先の判断と滑り止めの確保が重要。";
    currentAdvice = `今すぐやること: 内定先の条件・文化・キャリアパスを比較・承諾期限の確認・本当に行きたい企業の最終確認。内定を持った状態で次の選考に挑めると精神的に余裕が生まれます。`;
  } else {
    phase = "就活終了";
    phaseDetail = "お疲れ様でした。入社準備に切り替える時期。";
    currentAdvice = `入社準備: 引き継ぎ・スキルアップ・資格取得など入社までの時間を有効活用しましょう。`;
  }

  const schedule = `【${nendoLabel}就活スケジュール（標準ロードマップ）】
就活スタート（${graduationYear - 2}年3〜5月）: メール作成・証明写真・就活サービス登録・説明会・サマーインターン応募・ES作成・SPI勉強開始
夏インターン（${graduationYear - 2}年6〜8月）: 60〜100社エントリー目安・OB/OG訪問・面接練習・Webテスト対策
早期選考（${graduationYear - 2}年9〜12月）: 夏インターン振り返り・早期選考（年内内定も）・冬インターン（本選考直結）・業界絞り込み
本選考（${graduationYear - 1}年1〜3月）: 本選考エントリー・企業分析・キャリアプラン・SPI最終対策
内定・終了（${graduationYear - 1}年4月〜）: 内定獲得・就活終了（就活生の6割以上がこの時期）
重要: 早期選考ルートを狙う・就活の軸を一貫させる・面接は場数が全て・OB/OG訪問は最強の情報源`;

  // 卒業まで12ヶ月以上 = インターン活動期（本選考前）
  const isInternPhase = monthsUntil > 12;
  const offeredLabel = isInternPhase ? "インターン合格" : "内定";

  return { nendoLabel, phase, phaseDetail, schedule, currentAdvice, isInternPhase, offeredLabel, monthsUntil };
}
