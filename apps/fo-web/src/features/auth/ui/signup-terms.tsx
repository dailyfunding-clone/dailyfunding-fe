"use client";

import { useState } from "react";

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

export const termIds = (borrower: boolean) =>
  [...TERMS, ...(borrower ? BORROWER_TERMS : [])].map((t) => t.id);

const SignupTerms = ({ borrower = false }: { borrower?: boolean }) => {
  const terms = borrower ? [...TERMS, ...BORROWER_TERMS] : TERMS;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = terms.every((t) => checked[t.id]);

  return (
    <fieldset className="auth-terms">
      <legend>약관 동의</legend>
      <label className="terms-all">
        <input
          type="checkbox"
          aria-label="모두 동의해요"
          checked={allChecked}
          onChange={(e) => {
            setChecked(
              Object.fromEntries(terms.map((t) => [t.id, e.target.checked])),
            );
          }}
        />
        모두 동의해요
      </label>
      {terms.map((t) => (
        <label key={t.id}>
          <input
            type="checkbox"
            name="term"
            value={t.id}
            aria-label={t.label}
            checked={checked[t.id] ?? false}
            onChange={(e) => {
              setChecked((prev) => ({ ...prev, [t.id]: e.target.checked }));
            }}
          />{" "}
          {t.label}
        </label>
      ))}
    </fieldset>
  );
};

export default SignupTerms;
