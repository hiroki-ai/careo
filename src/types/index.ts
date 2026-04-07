export type CompanyStatus =
  | "WISHLIST"
  | "INTERN_APPLYING"
  | "INTERN_DOCUMENT"
  | "INTERN_INTERVIEW_1"
  | "INTERN_INTERVIEW_2"
  | "INTERN_FINAL"
  | "INTERN"
  | "APPLIED"
  | "DOCUMENT"
  | "INTERVIEW_1"
  | "INTERVIEW_2"
  | "FINAL"
  | "OFFERED"
  | "REJECTED";

export type EsStatus = "DRAFT" | "SUBMITTED";

export type InterviewResult = "PASS" | "FAIL" | "PENDING";

export type InterviewMood = "good" | "nervous" | "hot" | "tired" | "neutral";

export const INTERVIEW_MOOD_LABELS: Record<InterviewMood, { emoji: string; label: string }> = {
  good:    { emoji: "😊", label: "楽しかった" },
  nervous: { emoji: "😤", label: "緊張した" },
  hot:     { emoji: "🔥", label: "手応えあり" },
  tired:   { emoji: "😴", label: "疲れた" },
  neutral: { emoji: "😶", label: "普通" },
};

export interface QAPair {
  id: string;
  question: string;
  answer: string;
}

export interface SelectionStage {
  name: string;
  timing: string;
  notes?: string;
}

export interface SelectionSchedule {
  stages: SelectionStage[];
  overallTimeline: string;
  tips?: string;
  disclaimer: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  url?: string;
  mypage_url?: string;
  status: CompanyStatus;
  notes?: string;
  ai_research?: string | null;
  selection_schedule?: string | null;
  is_intern_offer?: boolean | null;
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
  mood?: InterviewMood;
  createdAt: string;
  updatedAt: string;
}

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  WISHLIST: "気になる",
  INTERN_APPLYING: "インターン応募",
  INTERN_DOCUMENT: "インターン書類選考",
  INTERN_INTERVIEW_1: "インターン1次面接",
  INTERN_INTERVIEW_2: "インターン2次面接",
  INTERN_FINAL: "インターン最終面接",
  INTERN: "インターン中",
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
  "INTERN_APPLYING",
  "INTERN_DOCUMENT",
  "INTERN_INTERVIEW_1",
  "INTERN_INTERVIEW_2",
  "INTERN_FINAL",
  "INTERN",
  "APPLIED",
  "DOCUMENT",
  "INTERVIEW_1",
  "INTERVIEW_2",
  "FINAL",
  "OFFERED",
  "REJECTED",
];

export type JobSearchStage =
  | "not_started"
  | "just_started"
  | "in_progress";

export const JOB_SEARCH_STAGE_LABELS: Record<JobSearchStage, string> = {
  not_started: "まだ始めていない",
  just_started: "始めたばかり",
  in_progress: "本格的に進めている",
};

export const INDUSTRIES = [
  "IT・ソフトウェア",
  "コンサルティング",
  "金融・銀行・証券",
  "メーカー・製造",
  "商社",
  "メディア・広告",
  "不動産・建設",
  "小売・流通",
  "医療・製薬",
  "エネルギー",
  "教育",
  "官公庁・非営利",
  "その他",
];

export const JOB_TYPES = [
  "エンジニア・開発",
  "コンサルタント",
  "営業",
  "マーケティング",
  "企画・経営",
  "データサイエンス・AI",
  "デザイン・クリエイティブ",
  "人事・総務",
  "財務・経理",
  "研究・開発",
  "その他",
];

export const GRADES = [
  "学部1年", "学部2年", "学部3年", "学部4年",
  "修士1年", "修士2年",
  "博士課程",
  "その他",
];

export type UserPlan = "free" | "pro";

export interface CareerCenterVisibility {
  targetIndustriesJobs: boolean; // 志望業界・職種
  companies: boolean;            // 選考中の企業名・選考フェーズ
  esSelfAnalysis: boolean;       // ES・自己分析の内容
  obVisits: boolean;             // OB/OG訪問の実施件数・訪問先業界
  aptitudeTests: boolean;        // 筆記試験スコア
  offerStatus: boolean;          // 内定の有無
}

export const DEFAULT_CAREER_CENTER_VISIBILITY: CareerCenterVisibility = {
  targetIndustriesJobs: true,
  companies: true,
  esSelfAnalysis: true,
  obVisits: true,
  aptitudeTests: true,
  offerStatus: true,
};

export interface PdcaResult {
  plan: { weeklyGoal: string; taskCompletion: string };
  do: { highlights: string[]; totalActivity: string };
  check: { score: number; goodPoints: string[]; issues: string[]; insight: string };
  act: { improvements: string[]; nextWeekFocus: string; encouragement: string };
}

export interface UserProfile {
  id: string;
  username?: string;
  university: string;
  faculty: string;
  grade: string;
  graduationYear: number;
  targetIndustries: string[];
  targetJobs: string[];
  jobSearchStage: JobSearchStage;
  plan?: UserPlan; // DB追加後にデフォルト'free'
  // 自己分析（ユーザー入力）
  careerAxis?: string;
  gakuchika?: string;
  selfPr?: string;
  strengths?: string;
  weaknesses?: string;
  // AIがチャットから生成した自己分析（ユーザー入力とは別管理）
  aiSelfAnalysis?: {
    careerAxis?: string;
    gakuchika?: string;
    selfPr?: string;
    strengths?: string;
    weaknesses?: string;
  };
  // キャリアセンターへの公開設定（デフォルト全公開）
  careerCenterVisibility?: CareerCenterVisibility;
  // コーチ選択（デバイス間同期）
  coachId?: string;
  // デバイス間同期フィールド
  lastPdca?: PdcaResult | null;
  lastPdcaAt?: string | null;
  lastChatAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ObVisit {
  id: string;
  companyName: string;
  companyId?: string;
  personName?: string;
  visitedAt: string;
  purpose: "ob_visit" | "info_session" | "internship";
  insights?: string;
  impression?: "positive" | "neutral" | "negative";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const OB_VISIT_PURPOSE_LABELS: Record<ObVisit["purpose"], string> = {
  ob_visit: "OB/OG訪問",
  info_session: "会社説明会",
  internship: "インターン",
};

export const OB_IMPRESSION_LABELS: Record<NonNullable<ObVisit["impression"]>, string> = {
  positive: "好印象",
  neutral: "普通",
  negative: "懸念あり",
};

export interface AptitudeTest {
  id: string;
  companyName: string;
  companyId?: string;
  testType: "SPI" | "TG-WEB" | "玉手箱" | "CAB" | "GAB" | "SCOA" | "その他";
  testDate?: string;
  scoreVerbal?: number;
  scoreNonverbal?: number;
  scoreEnglish?: number;
  result: "PASS" | "FAIL" | "PENDING";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const APTITUDE_TEST_TYPES: AptitudeTest["testType"][] = [
  "SPI", "TG-WEB", "玉手箱", "CAB", "GAB", "SCOA", "その他",
];

// ============================================================
// キャリアセンターポータル（スタッフ側）型定義
// ============================================================

export interface CareerCenterStaff {
  id: string;
  userId: string;
  university: string;
  name: string;
  role: "staff" | "manager";
  createdAt: string;
  updatedAt: string;
}

export interface CareerCenterAnnouncement {
  id: string;
  staffId: string;
  university: string;
  title: string;
  body: string;
  targetGrade?: string | null;
  targetGradYear?: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ポータル学生一覧用サマリー型
export interface StudentSummary {
  userId: string;
  name?: string; // user_profiles に name がない場合は email から
  email: string;
  university: string;
  faculty: string;
  grade: string;
  graduationYear: number;
  jobSearchStage: JobSearchStage;
  targetIndustries: string[];
  targetJobs: string[];
  careerCenterVisibility: CareerCenterVisibility;
  // 集計
  companiesCount: number;
  offeredCount: number;
  interviewCount: number;
  obVisitCount: number;
  createdAt: string;
}

// 学生詳細用型（visibility を考慮した表示データ）
export interface StudentDetail extends StudentSummary {
  careerAxis?: string;
  selfPr?: string;
  strengths?: string;
  weaknesses?: string;
  companies: {
    id: string;
    name: string;
    industry: string;
    status: CompanyStatus;
  }[];
  obVisits: {
    id: string;
    companyName: string;
    visitedAt: string;
    purpose: string;
    impression?: string;
  }[];
  aptitudeTests: {
    id: string;
    companyName: string;
    testType: string;
    result: string;
    scoreVerbal?: number;
    scoreNonverbal?: number;
  }[];
}

// ── Phase 2 新規型定義 ───────────────────────────────────────────

export type MeetingOutcome = "positive" | "neutral" | "followup_needed";

export interface CareerCenterMeeting {
  id: string;
  staffId: string;
  studentUserId: string;
  university: string;
  metAt: string;
  notes?: string | null;
  outcome: MeetingOutcome;
  createdAt: string;
}

export type EsReviewStatus = "pending" | "ai_done" | "staff_done" | "closed";

export interface EsReviewRequest {
  id: string;
  studentUserId: string;
  university: string;
  esEntryId: string;
  esSnapshot: {
    title: string;
    questions: { question: string; answer: string }[];
  };
  companyName?: string | null;
  studentMessage?: string | null;
  aiComment?: {
    score: number;
    readyToSubmit: boolean;
    checks: { passed: boolean; label: string; detail: string }[];
    summary: string;
    suggestions: string[];
  } | null;
  aiGeneratedAt?: string | null;
  staffFeedback?: string | null;
  staffId?: string | null;
  status: EsReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export type AlertType = "inactive_30d" | "no_companies_late" | "consecutive_rejections";

export interface CareerCenterAlert {
  id: string;
  university: string;
  studentUserId: string;
  alertType: AlertType;
  alertDetail?: Record<string, unknown> | null;
  isResolved: boolean;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface CareerCenterMessage {
  id: string;
  staffId: string;
  studentUserId: string;
  university: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export type EventType = "guidance" | "briefing" | "workshop" | "other";

export interface CareerCenterEvent {
  id: string;
  staffId: string;
  university: string;
  title: string;
  eventType: EventType;
  heldAt: string;
  description?: string | null;
  createdAt: string;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  studentUserId: string;
  university: string;
  attendedAt: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  guidance: "就活ガイダンス",
  briefing: "企業説明会",
  workshop: "ワークショップ",
  other: "その他",
};

export const MEETING_OUTCOME_LABELS: Record<MeetingOutcome, string> = {
  positive: "良好",
  neutral: "通常",
  followup_needed: "フォローアップ必要",
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  inactive_30d: "30日以上未ログイン",
  no_companies_late: "企業登録なし（時期遅れ）",
  consecutive_rejections: "連続不合格",
};

export const COMPANY_STATUS_COLORS: Record<CompanyStatus, string> = {
  WISHLIST: "bg-gray-100 text-gray-700",
  INTERN_APPLYING: "bg-teal-50 text-teal-600",
  INTERN_DOCUMENT: "bg-teal-100 text-teal-700",
  INTERN_INTERVIEW_1: "bg-teal-200 text-teal-800",
  INTERN_INTERVIEW_2: "bg-teal-300 text-teal-900",
  INTERN_FINAL: "bg-cyan-200 text-cyan-900",
  INTERN: "bg-cyan-100 text-cyan-800",
  APPLIED: "bg-blue-100 text-blue-700",
  DOCUMENT: "bg-yellow-100 text-yellow-700",
  INTERVIEW_1: "bg-orange-100 text-orange-700",
  INTERVIEW_2: "bg-orange-200 text-orange-800",
  FINAL: "bg-purple-100 text-purple-700",
  OFFERED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

// ── 相談予約システム ─────────────────────────────────────────────

export type AppointmentStatus = 'confirmed' | 'cancelled_by_student' | 'cancelled_by_staff';

export interface AppointmentSlot {
  id: string;
  staffId: string;
  staffEmail: string;
  university: string;
  startsAt: string;
  durationMinutes: number;
  maxBookings: number;
  notes?: string | null;
  isCancelled: boolean;
  createdAt: string;
}

export interface AppointmentBooking {
  id: string;
  slotId: string;
  studentUserId: string;
  university: string;
  studentMessage?: string | null;
  status: AppointmentStatus;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSlotWithBookings extends AppointmentSlot {
  bookings: (AppointmentBooking & {
    studentName?: string;
    studentFaculty?: string;
    studentGrade?: string;
  })[];
  bookingsCount: number;
}

export interface AppointmentSlotForStudent extends AppointmentSlot {
  myBooking?: AppointmentBooking | null;
  availableCount: number;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: '予約済み',
  cancelled_by_student: 'キャンセル（学生）',
  cancelled_by_staff: 'キャンセル（職員）',
};

// ── 説明会・インターン日程 ──────────────────────────────────────────────────

export type CompanyEventType = "説明会" | "インターン" | "セミナー" | "その他";
export type CompanyEventStatus = "upcoming" | "done" | "skipped";

export interface CompanyEvent {
  id: string;
  companyId?: string | null;
  companyName: string;
  eventType: CompanyEventType;
  scheduledAt: string;  // ISO datetime
  endDate?: string | null;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
  status: CompanyEventStatus;
  createdAt: string;
  updatedAt: string;
}

export const COMPANY_EVENT_TYPE_LABELS: Record<CompanyEventType, string> = {
  説明会: "説明会",
  インターン: "インターン",
  セミナー: "セミナー",
  その他: "その他",
};

export const COMPANY_EVENT_TYPE_COLORS: Record<CompanyEventType, string> = {
  説明会: "bg-orange-100 text-orange-700",
  インターン: "bg-green-100 text-green-700",
  セミナー: "bg-indigo-100 text-indigo-700",
  その他: "bg-gray-100 text-gray-600",
};

export const COMPANY_EVENT_TYPES: CompanyEventType[] = ["説明会", "インターン", "セミナー", "その他"];
