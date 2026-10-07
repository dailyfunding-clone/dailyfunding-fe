import { notFound } from "next/navigation";
import { Suspense } from "react";

import { fetchJson } from "@/entities/content/index.server";
import { AppLink } from "@/shared/ui";

import ApplyForm from "./apply-form";

import type { LoanProduct } from "../../types";
import type { Metadata } from "next";
import "../../loan.scss";

export const metadata: Metadata = { title: "대출 신청" };


const LoanApplyContent = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const loan = await fetchJson<LoanProduct>(`/loans/${id}`);
  if (!loan) notFound();
  return (
    <main className="container apply-shell">
      <h1 className="page-title">대출 신청</h1>
      <p className="loan-sub">
        {loan.name} · 연 {loan.rate_range[0]}~{loan.rate_range[1]}% ·{" "}
        <AppLink href={`/loan/${loan.id}`}>상품 상세 보기</AppLink>
      </p>
      <ApplyForm />
    </main>
  );
};

const LoanApplyPage = (props: { params: Promise<{ id: string }> }) => (
  <Suspense fallback={null}>
    <LoanApplyContent {...props} />
  </Suspense>
);

export default LoanApplyPage;
