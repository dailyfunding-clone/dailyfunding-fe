export const STATUS_LABEL: Record<string, string> = {
  draft: "임시저장",
  scheduled: "모집예정",
  recruiting: "모집중",
  recruited: "모집완료",
  executed: "실행완료",
  repaying: "상환중",
  repaid: "상환완료",
  overdue: "연체",
  loss: "손실",
};

export const TYPE_LABEL: Record<string, string> = {
  scf: "매출채권",
  stock_loan: "주식담보",
  mortgage: "부동산담보",
  personal_credit: "개인신용",
};

export const REPAY_LABEL: Record<string, string> = {
  equal_installment: "원리금균등",
  equal_principal: "원금균등",
  bullet: "만기일시",
};

export const GRADE_LABEL: Record<string, string> = {
  general: "일반투자자",
  income_eligible: "소득적격투자자",
  professional: "전문투자자",
};

export const DECISION_LABEL: Record<string, string> = {
  submitted: "심사대기",
  approved: "승인",
  rejected: "거절",
  converted: "상품전환",
};

export const NEXT_STATUS: Record<string, { to: string; label: string }[]> = {
  draft: [
    { to: "scheduled", label: "모집 예정" },
    { to: "recruiting", label: "모집 시작" },
  ],
  scheduled: [{ to: "recruiting", label: "모집 시작" }],
  recruiting: [{ to: "recruited", label: "모집 마감" }],
  executed: [{ to: "repaying", label: "상환 시작" }],
  repaying: [
    { to: "repaid", label: "상환 완료" },
    { to: "overdue", label: "연체 전환" },
    { to: "loss", label: "손실 처리" },
  ],
  overdue: [
    { to: "repaid", label: "상환 완료" },
    { to: "loss", label: "손실 처리" },
  ],
};

export const badgeClass = (status: string) =>
  status === "overdue" || status === "loss" || status === "rejected"
    ? "badge badge-danger"
    : status === "recruiting" || status === "repaying" || status === "approved"
      ? "badge badge-accent"
      : "badge";
