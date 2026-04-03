"use client";

import { useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface DeepQuestion {
  id: string;
  category: "careerAxis" | "gakuchika" | "selfPr" | "strengths" | "weaknesses";
  question: string;
  hint: string;
  examples: string[]; // 過去の就活生の回答例（3つ）
  followUp?: string; // 深掘り質問
}

const DEEP_QUESTIONS: DeepQuestion[] = [
  // 就活の軸
  {
    id: "q1",
    category: "careerAxis",
    question: "10年後、どんな仕事をしている自分が「一番かっこいい」と思いますか？",
    hint: "職種・役職・状況を具体的にイメージしてみてください",
    examples: [
      "複数の国でプロジェクトを動かしているビジネスマン。英語で交渉し、現地チームを率いている自分がかっこいいと思う。",
      "自分が立ち上げた新規事業が世の中に認知されていて、それが誰かの生活を便利にしている。事業家として生きる自分。",
      "専門性を持ったコンサルタントとして、経営者に頼られる存在になっている。答えのない問いに向き合い続けている自分。",
    ],
    followUp: "→ その姿になるために、5年後は何をしていたいですか？",
  },
  {
    id: "q2",
    category: "careerAxis",
    question: "「絶対にこれだけは嫌だ」という働き方はありますか？その理由は？",
    hint: "仕事の中身・環境・人間関係・評価方法など、どんな側面でも",
    examples: [
      "成果が数字でしか評価されない仕事。プロセスや工夫を見てもらえないと、頑張る意欲が湧かないと感じている。",
      "一人でこなすルーティン業務。誰かと議論しながら作り上げていく過程に喜びを感じるので、チームで働く環境が欲しい。",
      "成長機会のない職場。20代のうちに圧倒的なスキルを身につけたいので、仕事量と責任がないと物足りなくなる。",
    ],
    followUp: "→ その反対が「理想の働き方」と言えますか？",
  },
  {
    id: "q3",
    category: "careerAxis",
    question: "就活を始める前と今で、「働くこと」についての考え方は変わりましたか？",
    hint: "変わっていなくてもOK。なぜ変わった/変わらなかったかを考えてみましょう",
    examples: [
      "最初は「とにかく給料が高いところ」と思っていたが、OB訪問を重ねて、仕事内容への興味が自分のモチベーションに直結すると気づいた。",
      "親の仕事を見て「安定が一番」と思っていたが、スタートアップでインターンして、変化する環境に飛び込む面白さを知った。",
      "変わっていない。小さい頃から「誰かの役に立つ仕事がしたい」という軸があり、今もそれが根本にある。",
    ],
  },

  // ガクチカ
  {
    id: "q4",
    category: "gakuchika",
    question: "その経験の中で、一番「しんどかった瞬間」はいつですか？何がしんどかった？",
    hint: "具体的な場面・時期・感情を思い出してみてください",
    examples: [
      "チームで文化祭の出し物を企画していたとき、3人がやる気を失って練習に来なくなった。責任感と焦りで眠れない日が続いた。",
      "研究で半年かけて出した結果が全部間違いだったとわかった瞬間。先輩に言い出せずに1週間一人で抱えた。",
      "飲食バイトでクレームを受けた際に、店長に「お前のせい」と言われ、アルバイト仲間の前で叱責された。",
    ],
    followUp: "→ そのとき、あなたはどう乗り越えましたか？",
  },
  {
    id: "q5",
    category: "gakuchika",
    question: "その経験を通じて、以前の自分と何が変わりましたか？",
    hint: "行動・考え方・人との関わり方など、変化したことを具体的に",
    examples: [
      "問題が起きたとき、一人で抱え込まずすぐ周囲に相談するようになった。助けを求めることは弱さではないと学んだ。",
      "完璧主義をやめ、70%の精度でまず動いてから修正するスタイルに変わった。結果として成果が出るまでの速度が上がった。",
      "反対意見を持つ人に積極的に話しかけるようになった。多様な視点を取り込むことで意思決定の質が上がると実感している。",
    ],
  },
  {
    id: "q6",
    category: "gakuchika",
    question: "その経験で得た「学び」を、就職後にどう使いますか？（具体的に）",
    hint: "「活かしたいと思います」で終わらず、どんな場面で・どう使うかまで",
    examples: [
      "チームで議論が停滞したとき、小グループに分けて意見を出しやすくする手法を使う。サークルで効果があった方法だから。",
      "新規プロジェクトを任されたとき、最初に全メンバーの強みと弱みを把握するヒアリングを実施する。そうすることで役割分担が最適化できると経験から学んだ。",
      "顧客対応で予期せぬ問題が起きたとき、まず謝罪より原因特定を優先する。バイトで学んだことを応用できる場面は多いと思う。",
    ],
  },

  // 自己PR
  {
    id: "q7",
    category: "selfPr",
    question: "あなたを一番よく知っている友人は、あなたをどんな人だと言いますか？",
    hint: "「〇〇な人だよね」と言われた言葉を思い出してみてください",
    examples: [
      "「絶対に約束を守る人」と言われる。どんなに忙しくても期限を破ったことがなく、それが信頼につながっていると思う。",
      "「話すと元気になる」と言われる。人の話を引き出すのが得意で、気づいたら相談役になっていることが多い。",
      "「やると言ったことは必ずやり切る人」。諦めない粘り強さが自分の強みだと、客観的に見ても思う。",
    ],
    followUp: "→ その言葉は正しいと思いますか？なぜそう思われているのでしょう？",
  },
  {
    id: "q8",
    category: "selfPr",
    question: "「この人のここが好きだ・尊敬する」と思った人は誰ですか？その人のどんな部分ですか？",
    hint: "尊敬する人の特徴は、あなた自身が大切にしていることと重なっていることが多いです",
    examples: [
      "ゼミの教授。どんな質問にも「それは面白い問いだ」と向き合い続ける知的好奇心。自分もそういう姿勢を持ちたい。",
      "サークルの先輩。失敗しても絶対に他人のせいにしない責任感。あの人のおかげで自分も責任を持って行動できるようになった。",
      "バイト先の店長。忙しい中でも一人ひとりに声をかけて気にかけてくれる。自分も将来そういうリーダーになりたいと思った。",
    ],
  },

  // 強み
  {
    id: "q9",
    category: "strengths",
    question: "これまでの人生で「自分、これが得意だな」と一番感じた瞬間はいつですか？",
    hint: "勉強・スポーツ・趣味・人間関係など、どんな場面でもOK",
    examples: [
      "議論が混乱しているとき、問題の本質を整理して「つまりこういうことだよね」と言えたとき。論点整理が得意だと気づいた。",
      "知らない人だらけの環境でも自然と話しかけて友達ができたとき。場の空気を読んで人を繋げるのが得意だと思った。",
      "数学の試験で「こんな解き方があるのか」と先生に褒められたとき。非常識な視点で物事を考えるのが強みだと思う。",
    ],
    followUp: "→ その場面で、あなたは具体的にどんな行動をしましたか？",
  },
  {
    id: "q10",
    category: "strengths",
    question: "「他の人ならこう考えるのに、自分は違うな」と思ったことはありますか？",
    hint: "考え方・アプローチ・優先順位が違うと感じた場面を思い出してください",
    examples: [
      "みんなが「失敗したくない」と守りに入るとき、「やってみなければわからない」と動ける。リスクテイクへの抵抗感が人より低い。",
      "チームが「とりあえずスピード優先」のとき、「品質が下がると後が大変」と細部にこだわる。長期目線で考える癖がある。",
      "困ったことがあると、他の人は解決策を探すが、自分はまず「なぜそうなったか」を掘り下げる。原因分析を優先してしまう。",
    ],
  },

  // 弱み
  {
    id: "q11",
    category: "weaknesses",
    question: "過去に「あのとき、こうすればよかった」と後悔した経験はありますか？",
    hint: "後悔の内容に、あなたの弱みが隠れていることが多いです",
    examples: [
      "サークルでの企画で「もう少し早く相談していれば」と思ったこと。自分で抱え込む傾向があり、助けを求めるのが遅かった。",
      "バイトのリーダーを任されたとき、厳しく言えずにチームのパフォーマンスが下がった。優しすぎて言うべきことを言えなかった。",
      "締め切り直前まで始めなかった課題で質が低かったとき。計画性のなさが結果に直結した苦い経験。",
    ],
    followUp: "→ 今はそれに対してどんな対策をとっていますか？",
  },
  {
    id: "q12",
    category: "weaknesses",
    question: "友人・家族・先輩から「こういうところ直したほうがいいよ」と言われたことはありますか？",
    hint: "言われたこと自体よりも、「なぜそう言われたか」を考えてみましょう",
    examples: [
      "「もう少し自分の意見を主張したほうがいい」と言われた。場の空気を読みすぎて、自分の考えを後回しにする癖がある。",
      "「心配性すぎる」と言われた。リスクを考えすぎて行動が遅くなることが多く、スピードで劣ることが弱みだと認識している。",
      "「もっとざっくりまとめて話して」と言われた。説明が長くなりすぎる傾向があり、伝え方の効率化が課題。",
    ],
  },
];

const CATEGORY_LABELS: Record<DeepQuestion["category"], string> = {
  careerAxis: "就活の軸",
  gakuchika: "ガクチカ",
  selfPr: "自己PR",
  strengths: "強み",
  weaknesses: "弱み",
};

const CATEGORY_COLORS: Record<DeepQuestion["category"], string> = {
  careerAxis: "bg-blue-100 text-blue-700",
  gakuchika: "bg-purple-100 text-purple-700",
  selfPr: "bg-emerald-100 text-emerald-700",
  strengths: "bg-amber-100 text-amber-700",
  weaknesses: "bg-red-100 text-red-600",
};

export default function DeepenPage() {
  const { profile, saveProfile } = useProfile();
  const { showToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExample, setShowExample] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const q = DEEP_QUESTIONS[currentIndex];
  const totalAnswered = Object.values(answers).filter((a) => a.trim().length > 0).length;

  const handleSave = async () => {
    if (!profile || !answers[q.id]?.trim()) return;

    const categoryKey = q.category;
    const existingContent = profile[categoryKey] ?? "";
    const newContent = existingContent.trim()
      ? `${existingContent}\n\n【深掘り: ${q.question}】\n${answers[q.id]}`
      : `【深掘り: ${q.question}】\n${answers[q.id]}`;

    await saveProfile({ ...profile, [categoryKey]: newContent });
    setSaved((prev) => ({ ...prev, [q.id]: true }));
    showToast(`「${CATEGORY_LABELS[q.category]}」に反映しました`, "success");
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <Link href="/career" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← 自己分析に戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">自己分析 深掘り</h1>
        <p className="text-sm text-gray-500 mt-1">
          質問に答えながら自己分析を深めましょう。回答を保存すると自己分析ページに反映されます。
        </p>
      </div>

      {/* 進捗 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{currentIndex + 1} / {DEEP_QUESTIONS.length} 問</span>
          <span>{totalAnswered}問に回答済み</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00c896] rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / DEEP_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 質問カード */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        {/* カテゴリバッジ */}
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${CATEGORY_COLORS[q.category]}`}>
          {CATEGORY_LABELS[q.category]}
        </span>

        {/* 質問 */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2 leading-relaxed">{q.question}</h2>
        <p className="text-xs text-gray-400 mb-5">💡 {q.hint}</p>

        {/* 回答テキストエリア */}
        <textarea
          value={answers[q.id] ?? ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00c896] focus:ring-1 focus:ring-[#00c896] resize-none"
          placeholder="自由に書いてみましょう。完璧でなくてOK。思ったことをそのまま言語化することが大切です。"
        />
        {answers[q.id] && (
          <p className="text-xs text-gray-400 text-right mt-1">{answers[q.id].length}字</p>
        )}

        {/* 深掘りヒント */}
        {q.followUp && answers[q.id]?.length > 20 && (
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
            <p className="text-xs text-amber-700 font-medium">{q.followUp}</p>
          </div>
        )}

        {/* 回答例 */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowExample(showExample === currentIndex ? null : currentIndex)}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {showExample === currentIndex ? "▲ 回答例を閉じる" : "▼ 過去の就活生の回答例を見る"}
          </button>

          {showExample === currentIndex && (
            <div className="mt-3 space-y-3">
              {q.examples.map((ex, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 mb-1.5">例 {i + 1}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{ex}</p>
                </div>
              ))}
              <p className="text-[10px] text-gray-400 mt-1">※ これらは参考例です。自分の言葉で書くことが最も重要です。</p>
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <div className="mt-5 flex gap-2">
          {saved[q.id] ? (
            <span className="text-sm text-emerald-600 font-medium self-center">✓ 自己分析に反映済み</span>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!answers[q.id]?.trim()}
              size="sm"
            >
              自己分析に反映する
            </Button>
          )}
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setCurrentIndex((i) => Math.max(0, i - 1)); setShowExample(null); }}
          disabled={currentIndex === 0}
          className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← 前の質問
        </button>
        <button
          type="button"
          onClick={() => { setCurrentIndex((i) => Math.min(DEEP_QUESTIONS.length - 1, i + 1)); setShowExample(null); }}
          disabled={currentIndex === DEEP_QUESTIONS.length - 1}
          className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#00c896] text-white hover:bg-[#00b586] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          次の質問 →
        </button>
      </div>

      {/* 質問一覧 */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">全{DEEP_QUESTIONS.length}問</p>
        <div className="grid grid-cols-2 gap-2">
          {DEEP_QUESTIONS.map((dq, i) => (
            <button
              key={dq.id}
              type="button"
              onClick={() => { setCurrentIndex(i); setShowExample(null); }}
              className={`text-left p-2.5 rounded-lg text-xs transition-colors ${
                i === currentIndex
                  ? "bg-[#00c896]/10 border border-[#00c896] text-[#00a87e] font-medium"
                  : answers[dq.id]?.trim()
                  ? "bg-green-50 border border-green-100 text-green-700"
                  : "bg-gray-50 border border-transparent text-gray-500 hover:bg-gray-100"
              }`}
            >
              <span className={`text-[10px] font-bold block mb-0.5 ${CATEGORY_COLORS[dq.category].split(" ")[1]}`}>
                {CATEGORY_LABELS[dq.category]}
              </span>
              <span className="line-clamp-2">{dq.question}</span>
              {answers[dq.id]?.trim() && <span className="text-emerald-500 mt-0.5 block">✓ 回答済み</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
