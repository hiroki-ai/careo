import { Company, ES, Interview } from "@/types";

export interface Advice {
  priority: "high" | "medium" | "low";
  category: string;
  message: string;
  link?: string;
}

export function generateAdvice(
  companies: Company[],
  esList: ES[],
  interviews: Interview[]
): Advice[] {
  const advices: Advice[] = [];
  const now = new Date();

  // 締切3日以内のESがある
  const urgentEs = esList.filter((e) => {
    if (!e.deadline || e.status === "SUBMITTED") return false;
    const days = Math.ceil((new Date(e.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  });

  urgentEs.forEach((e) => {
    const company = companies.find((c) => c.id === e.companyId);
    const days = Math.ceil((new Date(e.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    advices.push({
      priority: "high",
      category: "ES締切",
      message: `${company?.name ?? "企業"}の「${e.title}」の締切まであと${days}日です。今すぐ提出を完了させましょう。`,
      link: `/es/${e.id}`,
    });
  });

  // 3日以内に面接がある
  const upcomingInterviews = interviews.filter((i) => {
    if (i.result !== "PENDING") return false;
    const days = Math.ceil((new Date(i.scheduledAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  });

  upcomingInterviews.forEach((i) => {
    const company = companies.find((c) => c.id === i.companyId);
    const days = Math.ceil((new Date(i.scheduledAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    advices.push({
      priority: "high",
      category: "面接準備",
      message: `${company?.name ?? "企業"}の${i.round}次面接まであと${days}日。企業研究・逆質問の準備をしましょう。`,
      link: `/interviews/${i.id}`,
    });
  });

  // 回答が未入力のES設問がある
  const draftEsWithEmptyAnswers = esList.filter(
    (e) => e.status === "DRAFT" && e.questions.some((q) => !q.answer.trim() || q.answer === "（未記入）")
  );
  if (draftEsWithEmptyAnswers.length > 0) {
    advices.push({
      priority: "medium",
      category: "ES記入",
      message: `${draftEsWithEmptyAnswers.length}件のESに未記入の設問があります。早めに記入しましょう。`,
      link: "/es",
    });
  }

  // 気になる/応募済みで次のアクションがない企業
  const staleCompanies = companies.filter(
    (c) => c.status === "WISHLIST" || c.status === "APPLIED"
  );
  if (staleCompanies.length >= 3) {
    advices.push({
      priority: "medium",
      category: "企業フォロー",
      message: `「気になる」「応募済み」のまま止まっている企業が${staleCompanies.length}社あります。ステータスを更新しましょう。`,
      link: "/companies",
    });
  }

  // 内定がある場合の承諾検討
  const offeredCompanies = companies.filter((c) => c.status === "OFFERED");
  if (offeredCompanies.length > 0) {
    advices.push({
      priority: "medium",
      category: "内定検討",
      message: `${offeredCompanies.map((c) => c.name).join("・")}から内定をもらっています。承諾期限を確認しましょう。`,
      link: "/companies",
    });
  }

  // 面接結果が「結果待ち」のまま2週間以上経過
  const pendingInterviews = interviews.filter((i) => {
    if (i.result !== "PENDING") return false;
    const days = Math.ceil((now.getTime() - new Date(i.scheduledAt).getTime()) / (1000 * 60 * 60 * 24));
    return days > 14;
  });
  if (pendingInterviews.length > 0) {
    advices.push({
      priority: "low",
      category: "結果確認",
      message: `${pendingInterviews.length}件の面接結果が2週間以上更新されていません。企業に問い合わせるか、ステータスを更新しましょう。`,
      link: "/interviews",
    });
  }

  // 企業が少ない場合
  const activeCompanies = companies.filter(
    (c) => !["OFFERED", "REJECTED"].includes(c.status)
  );
  if (activeCompanies.length < 3 && companies.length < 5) {
    advices.push({
      priority: "low",
      category: "活動量",
      message: "選考中の企業が少なめです。もう少しエントリーを増やすことを検討しましょう。",
      link: "/companies",
    });
  }

  if (advices.length === 0) {
    advices.push({
      priority: "low",
      category: "状況良好",
      message: "現在、特に急ぎの対応は必要ありません。引き続き情報収集と企業研究を続けましょう。",
    });
  }

  // priorityでソート
  const order = { high: 0, medium: 1, low: 2 };
  return advices.sort((a, b) => order[a.priority] - order[b.priority]);
}
