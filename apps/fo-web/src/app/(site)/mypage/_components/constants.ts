import { ApiRequestError } from "@/shared/api";

export const GRADE_LABELS: Record<string, string> = {
  general: "일반투자자",
  income_eligible: "소득적격투자자",
  professional: "전문투자자",
};

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  scf: "매출채권",
  stock_loan: "주식담보",
  mortgage: "부동산담보",
  personal_credit: "개인신용",
};

export const INVESTMENT_STATUS_LABELS: Record<string, string> = {
  active: "진행중",
  repaid: "상환완료",
  overdue: "연체",
  loss: "손실",
  cancelled: "취소",
};

export const DAY_STATUS_LABELS: Record<string, string> = {
  scheduled: "상환 예정",
  paid: "상환 완료",
  overdue: "연체",
};

export const DEPOSIT_KIND_LABELS: Record<string, string> = {
  deposit: "입금",
  withdraw_hold: "출금 홀드",
  withdraw: "출금",
  withdraw_rollback: "출금 취소",
  invest: "투자",
  repay: "상환",
  loan_execute: "대출 실행",
  point_earn: "포인트 적립",
  point_spend: "포인트 전환",
  point_expire: "포인트 소멸",
  fee: "수수료",
};

export const POINT_KIND_LABELS: Record<string, string> = {
  earn: "적립",
  spend: "사용",
  expire: "소멸",
};

export const GRADE_REQUEST_STATUS_LABELS: Record<string, string> = {
  submitted: "심사중",
  approved: "승인",
  rejected: "반려",
};

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  requested: "처리 접수",
  processing: "이체 중",
  completed: "출금 완료",
  failed: "출금 실패",
};

export const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "SC제일은행",
  "카카오뱅크",
  "케이뱅크",
  "토스뱅크",
];

export const GRADE_LIMIT_TABLE = [
  {
    grade: "general",
    label: "일반투자자",
    total: 40_000_000,
    realEstate: 20_000_000,
    sameBorrower: 5_000_000,
    perProduct: "—",
  },
  {
    grade: "income_eligible",
    label: "소득적격투자자",
    total: 100_000_000,
    realEstate: 100_000_000,
    sameBorrower: 20_000_000,
    perProduct: "—",
  },
  {
    grade: "professional",
    label: "전문투자자",
    total: null,
    realEstate: null,
    sameBorrower: null,
    perProduct: "상품별 최대 40%",
  },
] as const;

const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "입력값을 확인해 주세요",
  IDEMPOTENCY_KEY_REQUIRED: "요청을 다시 시도해 주세요",
  IDEMPOTENCY_KEY_MISMATCH: "같은 요청이 이미 처리됐어요",
  UNAUTHORIZED: "로그인이 필요해요",
  PIN_LOCKED: "간편비밀번호가 잠겼어요",
  REAUTH_REQUIRED: "비밀번호 확인이 필요해요",
  SUITABILITY_REQUIRED: "투자적합성 테스트가 필요해요",
  GRADE_LIMIT_EXCEEDED: "투자 한도를 초과했어요",
  BORROWER_LIMIT_EXCEEDED: "동일 차입자 한도를 초과했어요",
  NOT_FOUND: "찾을 수 없어요",
  RECRUITMENT_CLOSED: "모집이 마감됐어요",
  INSUFFICIENT_DEPOSIT: "예치금이 부족해요",
  INSUFFICIENT_REMAINING: "잔여 모집 금액이 부족해요",
  STATE_CONFLICT: "지금은 처리할 수 없어요",
  EMAIL_TAKEN: "이미 가입된 이메일이에요",
  DUPLICATE_CI: "이미 가입된 본인인증 정보예요",
  INTERNAL: "잠시 후 다시 시도해 주세요",
};

export const apiErrorMessage = (error: unknown, fallback = "잠시 후 다시 시도해 주세요") => {
  if (error instanceof ApiRequestError) {
    return ERROR_MESSAGES[error.code] ?? error.message ?? fallback;
  }
  return fallback;
};
