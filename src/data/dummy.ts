import { Company, ES, Interview } from "@/types";

export const dummyCompanies: Company[] = [
  {
    id: "c1",
    name: "株式会社テックビジョン",
    industry: "IT・ソフトウェア",
    url: "https://example.com",
    status: "INTERVIEW_1",
    notes: "自社開発メイン。Reactを使っているらしい。",
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-03-01T10:00:00Z",
  },
  {
    id: "c2",
    name: "グローバル商事株式会社",
    industry: "商社",
    url: "https://example2.com",
    status: "DOCUMENT",
    notes: "総合職。海外勤務の可能性あり。",
    createdAt: "2025-02-05T10:00:00Z",
    updatedAt: "2025-03-05T10:00:00Z",
  },
  {
    id: "c3",
    name: "フューチャーコンサルティング",
    industry: "コンサルティング",
    status: "FINAL",
    notes: "最終面接まで進んだ。ケース面接対策が必要だった。",
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-03-10T10:00:00Z",
  },
  {
    id: "c4",
    name: "ネクストメディア株式会社",
    industry: "メディア・広告",
    status: "APPLIED",
    notes: "マーケティング職希望。",
    createdAt: "2025-03-01T10:00:00Z",
    updatedAt: "2025-03-01T10:00:00Z",
  },
  {
    id: "c5",
    name: "サクラ銀行",
    industry: "金融・銀行",
    status: "WISHLIST",
    notes: "リテール部門に興味あり。OB訪問予定。",
    createdAt: "2025-03-05T10:00:00Z",
    updatedAt: "2025-03-05T10:00:00Z",
  },
  {
    id: "c6",
    name: "スタートアップABC",
    industry: "IT・スタートアップ",
    status: "OFFERED",
    notes: "内定もらった。年収交渉済み。",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-03-08T10:00:00Z",
  },
];

export const dummyEsList: ES[] = [
  {
    id: "e1",
    companyId: "c1",
    title: "2026年新卒ES",
    questions: [
      {
        id: "q1",
        question: "学生時代に最も力を入れたことを教えてください（400字以内）",
        answer:
          "プログラミングサークルの代表として、30人のメンバーをまとめてハッカソンで優勝を目指した経験です。メンバーのスキル差が大きく、チームとしての方向性が定まらないという課題がありました。私は週1回の勉強会を企画し、全員が同じベースラインに立てるよう努めました。結果、全国ハッカソンで3位入賞を達成できました。",
      },
      {
        id: "q2",
        question: "志望動機を教えてください（300字以内）",
        answer:
          "貴社のプロダクト開発に対する姿勢に共感しています。特にユーザーファーストの開発文化と、技術的チャレンジを推奨する環境に魅力を感じています。",
      },
    ],
    deadline: "2025-03-20T23:59:00Z",
    status: "SUBMITTED",
    createdAt: "2025-02-10T10:00:00Z",
    updatedAt: "2025-03-01T10:00:00Z",
  },
  {
    id: "e2",
    companyId: "c2",
    title: "グローバル商事 エントリーシート",
    questions: [
      {
        id: "q3",
        question: "あなたの強みと弱みを教えてください",
        answer:
          "強みは粘り強さです。一度決めたことは最後までやり切る意志があります。弱みは完璧主義な点で、時間をかけすぎることがあります。",
      },
      {
        id: "q4",
        question: "10年後のキャリアビジョンを教えてください",
        answer: "（未記入）",
      },
    ],
    deadline: "2025-03-25T23:59:00Z",
    status: "DRAFT",
    createdAt: "2025-03-01T10:00:00Z",
    updatedAt: "2025-03-10T10:00:00Z",
  },
  {
    id: "e3",
    companyId: "c4",
    title: "ネクストメディア ES",
    questions: [
      {
        id: "q5",
        question: "マーケティングに興味を持ったきっかけを教えてください",
        answer:
          "大学でSNSマーケティングのゼミに所属し、企業のSNS戦略を研究したことがきっかけです。",
      },
    ],
    deadline: "2025-03-30T23:59:00Z",
    status: "DRAFT",
    createdAt: "2025-03-05T10:00:00Z",
    updatedAt: "2025-03-05T10:00:00Z",
  },
];

export const dummyInterviews: Interview[] = [
  {
    id: "i1",
    companyId: "c1",
    round: 1,
    scheduledAt: "2025-03-05T14:00:00Z",
    interviewers: "人事部 田中さん、開発部 鈴木さん",
    questions: [
      {
        id: "iq1",
        question: "自己紹介をお願いします",
        answer:
          "〇〇大学情報工学部4年の山田と申します。学生時代はプログラミングサークルで代表を務め、Webアプリ開発に取り組んできました。",
      },
      {
        id: "iq2",
        question: "なぜエンジニアを志望しているのですか",
        answer:
          "ものを作ることへの情熱と、技術で社会課題を解決したいという思いからです。特に御社のプロダクトに触れて、ユーザー体験を重視する姿勢に共感しました。",
      },
      {
        id: "iq3",
        question: "チームで困難を乗り越えた経験を教えてください",
        answer:
          "ハッカソンでメンバー間のスキル差による摩擦を、勉強会企画で解決した話をした。",
      },
    ],
    notes:
      "雰囲気は和やか。技術的な質問はほぼなし。次回は技術面接とのこと。",
    result: "PASS",
    createdAt: "2025-03-05T16:00:00Z",
    updatedAt: "2025-03-05T16:00:00Z",
  },
  {
    id: "i2",
    companyId: "c3",
    round: 1,
    scheduledAt: "2025-02-20T11:00:00Z",
    interviewers: "コンサルタント 佐藤さん",
    questions: [
      {
        id: "iq4",
        question: "ケース：日本のコンビニの売上を2倍にするには？",
        answer:
          "まず市場を分析し、客単価向上と新規顧客獲得の2軸で考えました。客単価向上策としてサブスクサービスを提案しました。",
      },
    ],
    notes: "ケース面接の準備が不十分だった。フェルミ推定の練習が必要。",
    result: "PASS",
    createdAt: "2025-02-20T13:00:00Z",
    updatedAt: "2025-02-20T13:00:00Z",
  },
  {
    id: "i3",
    companyId: "c3",
    round: 3,
    scheduledAt: "2025-03-15T10:00:00Z",
    interviewers: "パートナー 山本さん",
    questions: [
      {
        id: "iq5",
        question: "当社でなければならない理由を教えてください",
        answer: "（準備中）",
      },
    ],
    notes: "最終面接。志望動機をより深掘りして準備する。",
    result: "PENDING",
    createdAt: "2025-03-10T10:00:00Z",
    updatedAt: "2025-03-10T10:00:00Z",
  },
];
