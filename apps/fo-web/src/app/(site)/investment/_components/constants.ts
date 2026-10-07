export const TYPE_LABEL: Record<string, string> = {
  scf: "SCF",
  stock_loan: "주식담보",
  mortgage: "부동산",
  personal_credit: "개인신용",
};

export const TYPE_OPTIONS = [
  { value: "scf", label: "SCF" },
  { value: "stock_loan", label: "주식담보" },
  { value: "mortgage", label: "부동산" },
  { value: "personal_credit", label: "개인신용" },
];

export const STATUS_LABEL: Record<string, string> = {
  draft: "준비중",
  scheduled: "모집예정",
  recruiting: "모집중",
  recruited: "모집완료",
  executed: "실행완료",
  repaying: "상환중",
  repaid: "상환완료",
  overdue: "연체",
  loss: "손실",
};

export const OPEN_STATUSES = new Set(["scheduled", "recruiting"]);
export const HIDDEN_STATUSES = new Set(["draft"]);

export const REPAY_LABEL: Record<string, string> = {
  equal_installment: "원리금균등",
  equal_principal: "원금균등",
  bullet: "만기일시",
};

export const INVEST_ERROR: Record<string, string> = {
  GRADE_LIMIT_EXCEEDED: "투자 한도를 초과했어요",
  BORROWER_LIMIT_EXCEEDED: "동일 차입자 한도를 초과했어요",
  INSUFFICIENT_DEPOSIT: "예치금이 부족해요",
  INSUFFICIENT_REMAINING: "잔여 모집금액을 초과했어요",
  RECRUITMENT_CLOSED: "모집이 마감된 상품이에요",
  SUITABILITY_REQUIRED: "투자적합성 테스트를 먼저 완료해 주세요",
  IDEMPOTENCY_KEY_REQUIRED: "요청이 올바르지 않아요. 다시 시도해 주세요",
  VALIDATION_ERROR: "입력값을 확인해 주세요",
  UNAUTHORIZED: "로그인이 필요해요",
  INTERNAL: "잠시 후 다시 시도해 주세요",
};

export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
};
