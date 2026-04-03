import { QAPair } from "@/types";
import { generateId } from "@/lib/utils";

export interface EsTemplate {
  id: string;
  label: string;
  industry: string;
  description: string;
  questions: Omit<QAPair, "id">[];
}

export const ES_TEMPLATES: EsTemplate[] = [
  {
    id: "t_general",
    label: "汎用テンプレート",
    industry: "全業種",
    description: "どの業界・職種にも使える基本構成",
    questions: [
      { question: "志望動機を教えてください（400字以内）", answer: "" },
      { question: "学生時代に最も力を入れたことを教えてください（400字以内）", answer: "" },
      { question: "自己PRをお聞かせください（300字以内）", answer: "" },
    ],
  },
  {
    id: "t_shosha",
    label: "総合商社",
    industry: "商社",
    description: "三菱・三井・伊藤忠・住友・丸紅向け",
    questions: [
      { question: "志望動機を教えてください（400字以内）", answer: "" },
      { question: "学生時代最も打ち込んだことは何ですか？そこから何を学びましたか？（400字以内）", answer: "" },
      { question: "当社でどのような仕事に携わり、どんな価値を創出したいですか？（400字以内）", answer: "" },
      { question: "あなたの強みと、それを発揮したエピソードを教えてください（300字以内）", answer: "" },
    ],
  },
  {
    id: "t_consult",
    label: "コンサルティング",
    industry: "コンサルティング",
    description: "MBB・アクセンチュア・デロイト等向け",
    questions: [
      { question: "当社を志望する理由を教えてください（400字以内）", answer: "" },
      { question: "これまでに直面した最大の困難と、それをどう乗り越えたか教えてください（400字以内）", answer: "" },
      { question: "コンサルタントとして解決したい社会課題は何ですか？その理由も含めて（400字以内）", answer: "" },
      { question: "チームで成果を出した経験と、あなたが果たした役割を教えてください（300字以内）", answer: "" },
    ],
  },
  {
    id: "t_iteng",
    label: "IT・エンジニア",
    industry: "IT・ソフトウェア",
    description: "SIer・メガベンチャー・スタートアップ向け",
    questions: [
      { question: "志望動機を教えてください（400字以内）", answer: "" },
      { question: "これまでに取り組んだ技術的な開発・プロジェクトについて教えてください（400字以内）", answer: "" },
      { question: "入社後どんな技術・領域で価値を発揮したいですか？（400字以内）", answer: "" },
      { question: "困難な技術課題をどのように解決しましたか？（300字以内）", answer: "" },
    ],
  },
  {
    id: "t_finance",
    label: "金融（銀行・証券）",
    industry: "金融・銀行・証券",
    description: "メガバンク・証券・保険・信託向け",
    questions: [
      { question: "志望動機を教えてください（400字以内）", answer: "" },
      { question: "学生時代に最も力を入れたことを教えてください（400字以内）", answer: "" },
      { question: "当社でどのような分野の仕事に携わりたいですか？（400字以内）", answer: "" },
      { question: "あなたの強みを教えてください（300字以内）", answer: "" },
    ],
  },
  {
    id: "t_maker",
    label: "メーカー・製造",
    industry: "メーカー・製造",
    description: "電機・自動車・食品・化学等のメーカー向け",
    questions: [
      { question: "志望動機を教えてください（400字以内）", answer: "" },
      { question: "学生時代に最も力を入れたことを教えてください（400字以内）", answer: "" },
      { question: "当社でどんな製品・事業に携わりたいですか？その理由も（400字以内）", answer: "" },
      { question: "あなたを一言で表すと何ですか？エピソードと共に（300字以内）", answer: "" },
    ],
  },
  {
    id: "t_koumuin",
    label: "国家公務員・省庁",
    industry: "官公庁・非営利",
    description: "国家総合職・各省庁向け",
    questions: [
      { question: "志望動機を教えてください（400字以内）", answer: "" },
      { question: "学生時代に最も力を入れたことを教えてください（400字以内）", answer: "" },
      { question: "入省後に取り組みたい政策課題は何ですか？（400字以内）", answer: "" },
      { question: "公務員として大切にしたい価値観を教えてください（300字以内）", answer: "" },
    ],
  },
  {
    id: "t_media",
    label: "メディア・広告",
    industry: "メディア・広告",
    description: "テレビ・出版・広告代理店向け",
    questions: [
      { question: "志望動機を教えてください（400字以内）", answer: "" },
      { question: "学生時代に最も打ち込んだことを教えてください（400字以内）", answer: "" },
      { question: "入社後に作りたいコンテンツ・取り組みたい仕事を教えてください（400字以内）", answer: "" },
      { question: "あなたの強みは何ですか？（300字以内）", answer: "" },
    ],
  },
];

export function templateToQuestions(template: EsTemplate): QAPair[] {
  return template.questions.map((q) => ({ ...q, id: generateId() }));
}
