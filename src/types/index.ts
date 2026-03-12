export type CompanyStatus =
  | "WISHLIST"
  | "APPLIED"
  | "DOCUMENT"
  | "INTERVIEW_1"
  | "INTERVIEW_2"
  | "FINAL"
  | "OFFERED"
  | "REJECTED";

export type EsStatus = "DRAFT" | "SUBMITTED";

export type InterviewResult = "PASS" | "FAIL" | "PENDING";

export interface QAPair {
  id: string;
  question: string;
  answer: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  url?: string;
  status: CompanyStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ES {
  id: string;
  companyId: string;
  title: string;
  questions: QAPair[];
  deadline?: string;
  status: EsStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  companyId: string;
  round: number;
  scheduledAt: string;
  interviewers?: string;
  questions: QAPair[];
  notes?: string;
  result: InterviewResult;
  createdAt: string;
  updatedAt: string;
}

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  WISHLIST: "気になる",
  APPLIED: "応募済み",
  DOCUMENT: "書類選考中",
  INTERVIEW_1: "1次面接",
  INTERVIEW_2: "2次面接",
  FINAL: "最終面接",
  OFFERED: "内定",
  REJECTED: "不採用",
};

export const COMPANY_STATUS_ORDER: CompanyStatus[] = [
  "WISHLIST",
  "APPLIED",
  "DOCUMENT",
  "INTERVIEW_1",
  "INTERVIEW_2",
  "FINAL",
  "OFFERED",
  "REJECTED",
];

export const COMPANY_STATUS_COLORS: Record<CompanyStatus, string> = {
  WISHLIST: "bg-gray-100 text-gray-700",
  APPLIED: "bg-blue-100 text-blue-700",
  DOCUMENT: "bg-yellow-100 text-yellow-700",
  INTERVIEW_1: "bg-orange-100 text-orange-700",
  INTERVIEW_2: "bg-orange-200 text-orange-800",
  FINAL: "bg-purple-100 text-purple-700",
  OFFERED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};
