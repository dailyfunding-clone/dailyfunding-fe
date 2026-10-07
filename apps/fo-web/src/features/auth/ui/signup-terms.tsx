const TERMS = [
  { id: "service", label: "(필수) 서비스 이용약관" },
  { id: "investment", label: "(필수) 온라인연계투자약관" },
  { id: "electronic_finance", label: "(필수) 전자금융거래약관" },
  { id: "privacy", label: "(필수) 개인정보 처리방침" },
  { id: "credit_info", label: "(필수) 신용정보 활용체제" },
  { id: "marketing", label: "(선택) 마케팅 소식 받기" },
];

const BORROWER_TERMS = [
  { id: "credit_inquiry", label: "(필수) 개인(신용)정보 조회 동의" },
  { id: "loan_terms", label: "(필수) 온라인연계대출약관" },
];

const SignupTerms = ({ borrower = false }: { borrower?: boolean }) => (
  <fieldset className="auth-terms">
    <legend>약관 동의</legend>
    <label className="terms-all">
      <input
        type="checkbox"
        aria-label="모두 동의해요"
        onChange={(e) => {
          const boxes =
            e.currentTarget.form?.querySelectorAll<HTMLInputElement>(
              'input[name="term"]',
            ) ?? [];
          boxes.forEach((b) => {
            b.checked = e.currentTarget.checked;
          });
        }}
      />
      모두 동의해요
    </label>
    {[...TERMS, ...(borrower ? BORROWER_TERMS : [])].map((t) => (
      <label key={t.id}>
        <input
          type="checkbox"
          name="term"
          value={t.id}
          aria-label={t.label}
        />{" "}
        {t.label}
      </label>
    ))}
  </fieldset>
);

export default SignupTerms;
