import { notFound } from "next/navigation";
import { Suspense } from "react";

import { fetchJson } from "@/entities/content/index.server";
import { fmtMan } from "@/shared/api";
import { AppLink } from "@/shared/ui";

import { CATEGORY_LABEL, faqOf, rateText, textOf } from "../types";

import type { LoanDetail } from "../types";
import type { Metadata } from "next";
import "../loan.scss";
import "@/entities/content/content.scss";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const loan = await fetchJson<LoanDetail>(`/loans/${id}`);
  return { title: loan?.name ?? "대출 상세" };
};

const DEFAULT_STEPS = ["신청", "서류 심사", "전자계약", "모집·실행"];

const DEFAULT_NOTICES = [
  "대출 시 귀하의 신용등급 또는 개인신용평점이 하락할 수 있어요.",
  "대출 원리금 상환을 연체하면 연체 이자가 부과되고 채무 불이행 정보가 등록될 수 있어요.",
  "과도한 대출은 개인신용평점 하락의 원인이 될 수 있어요.",
  "금리와 한도는 심사 결과에 따라 달라져요.",
];

const LoanDetailContent = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const loan = await fetchJson<LoanDetail>(`/loans/${id}`);
  if (!loan) notFound();
  const steps = loan.steps?.length ? loan.steps.map(textOf) : DEFAULT_STEPS;
  const features = (loan.features ?? []).map(textOf).filter(Boolean);
  const faqs = (loan.faqs ?? []).map(faqOf).filter((f): f is NonNullable<typeof f> => f !== null);
  return (
    <main className="container">
      <section className="loan-hero">
        <span className="badge badge-accent">{CATEGORY_LABEL[loan.category] ?? loan.category}</span>
        <h1>{loan.name}</h1>
        <p>{loan.summary || loan.target}</p>
        <div className="loan-hero-rate">
          <strong>{rateText(loan.rate_range)}</strong>
          <span>최대 {fmtMan(loan.max_limit)}</span>
        </div>
        <div className="loan-cta">
          <AppLink href={`/loan/${loan.id}/apply`} className="btn btn-primary">
            대출 신청하기
          </AppLink>
          <AppLink href={`/loan/limit-check?loan=${loan.id}`} className="btn btn-outline">
            한도 먼저 조회
          </AppLink>
        </div>
      </section>

      {features.length > 0 && (
        <section className="loan-section">
          <h2>이런 점이 좋아요</h2>
          <ul className="loan-features">
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="loan-section">
        <h2>대출 절차</h2>
        <ol className="loan-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <b>STEP {i + 1}</b>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="loan-section">
        <h2>상품 안내</h2>
        <table className="table">
          <tbody>
            <tr>
              <th>대상</th>
              <td>{loan.target}</td>
            </tr>
            <tr>
              <th>최대 한도</th>
              <td>{fmtMan(loan.max_limit)}</td>
            </tr>
            <tr>
              <th>금리</th>
              <td>{rateText(loan.rate_range)}</td>
            </tr>
            <tr>
              <th>기간</th>
              <td>{loan.term_desc}</td>
            </tr>
            <tr>
              <th>상환방식</th>
              <td>{loan.repay_method}</td>
            </tr>
            {Object.entries(loan.info ?? {}).map(([k, v]) => (
              <tr key={k}>
                <th>{k}</th>
                <td>{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {faqs.length > 0 && (
        <section className="loan-section">
          <h2>자주 묻는 질문</h2>
          <div className="accordion">
            {faqs.map((f, i) => (
              <details className="accordion-item" key={i}>
                <summary>{f.q}</summary>
                <div className="accordion-body">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="loan-section">
        <h2>유의사항</h2>
        {loan.notices ? (
          <p className="loan-notice">{loan.notices}</p>
        ) : (
          <ul className="loan-notice-list">
            {DEFAULT_NOTICES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="loan-section">
        <div className="loan-cta">
          <AppLink href={`/loan/${loan.id}/apply`} className="btn btn-primary">
            대출 신청하기
          </AppLink>
          <AppLink href="/cs/faq" className="btn btn-outline">
            문의하기
          </AppLink>
        </div>
      </section>
    </main>
  );
};

const LoanDetailPage = (props: { params: Promise<{ id: string }> }) => (
  <Suspense fallback={null}>
    <LoanDetailContent {...props} />
  </Suspense>
);

export default LoanDetailPage;
