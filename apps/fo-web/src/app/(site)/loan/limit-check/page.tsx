import { Suspense } from "react";

import { firstParam } from "@/entities/content";
import { fetchJson } from "@/entities/content/index.server";

import LimitCheckForm from "./limit-check-form";

import "../loan.scss";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "간편 한도 조회" };

const LimitCheckContent = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const loanId = Number(firstParam(params.loan)) || null;
  let loanName: string | null = null;
  if (loanId) {
    const loan = await fetchJson<{ name: string }>(`/loans/${loanId}`);
    loanName = loan?.name ?? null;
  }
  return (
    <main className="container apply-shell">
      <h1 className="page-title">
        간편 한도 조회 <span className="badge">시뮬레이션</span>
      </h1>
      <p className="loan-sub">
        {loanName
          ? `${loanName}의 예상 한도를 확인해 보세요`
          : "1분이면 예상 한도와 금리를 확인할 수 있어요"}
      </p>
      <LimitCheckForm loanId={loanId} />
    </main>
  );
};

const LimitCheckPage = (props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => (
  <Suspense fallback={null}>
    <LimitCheckContent {...props} />
  </Suspense>
);

export default LimitCheckPage;
