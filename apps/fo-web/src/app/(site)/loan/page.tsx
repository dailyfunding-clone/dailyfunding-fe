import { Suspense } from "react";

import ProductListSkeleton from "@/app/(site)/investment/_components/product-list-skeleton";
import { firstParam } from "@/entities/content";
import { fetchJson } from "@/entities/content/index.server";
import { fmtMan } from "@/shared/api";
import { AppLink } from "@/shared/ui";

import { CATEGORY_LABEL, rateText } from "./types";

import type { LoanProduct } from "./types";
import "./loan.scss";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "대출받기" };

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "personal", label: "개인대출" },
  { key: "business", label: "기업대출" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const LoanListContent = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const category = firstParam(params.category) ?? "all";
  const data = await fetchJson<{ results: LoanProduct[] }>("/loans");
  const all = data?.results ?? [];
  const loans = category === "all" ? all : all.filter((l) => l.category === category);
  return (
    <main className="container">
      <div className="loan-head">
        <h1 className="page-title">대출받기</h1>
        <div className="loan-head-actions">
          <AppLink href="/loan/limit-check" className="btn btn-outline">
            간편 한도 조회
          </AppLink>
          <AppLink href="/auth/signup/borrower" className="btn btn-outline">
            대출자 가입
          </AppLink>
        </div>
      </div>
      <nav className="tabs">
        {CATEGORIES.map((c) => (
          <AppLink
            key={c.key}
            href={c.key === "all" ? "/loan" : `/loan?category=${c.key}`}
            className={category === c.key ? "is-active" : undefined}
          >
            {c.label}
          </AppLink>
        ))}
      </nav>
      {loans.length === 0 ? (
        <div className="empty">등록된 대출 상품이 없어요</div>
      ) : (
        <div className="card-grid loan-cards">
          {loans.map((l) => (
            <AppLink key={l.id} href={`/loan/${l.id}`} className="card loan-card">
              <span className={`badge${l.category === "personal" ? " badge-accent" : ""}`}>
                {CATEGORY_LABEL[l.category] ?? l.category}
              </span>
              <h3>{l.name}</h3>
              <p className="loan-card-target">{l.target}</p>
              <div className="loan-card-rate">
                <strong>{rateText(l.rate_range)}</strong>
              </div>
              <div className="loan-card-meta">
                <span>
                  <b>최대 한도</b>
                  {fmtMan(l.max_limit)}
                </span>
                <span>
                  <b>기간</b>
                  {l.term_desc}
                </span>
                <span>
                  <b>상환방식</b>
                  {l.repay_method}
                </span>
              </div>
            </AppLink>
          ))}
        </div>
      )}
    </main>
  );
};

const LoanListPage = (props: { searchParams: SearchParams }) => (
  <Suspense fallback={<ProductListSkeleton />}>
    <LoanListContent {...props} />
  </Suspense>
);

export default LoanListPage;
