import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { API_URL, fmtMan, fmtWon } from "@/shared/api";
import { AppLink } from "@/shared/ui";

import { ProductActions } from "../_components";
import { ProductTabs } from "../_components";
import { RefreshButton } from "../_components";
import {
  REPAY_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  fmtDate,
} from "../_components";

import type { ProductDetail } from "../_components";
import type { Metadata } from "next";
import "../investment.scss";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const p = await fetchProduct(id);
  return { title: p?.name ?? "상품 상세" };
};


const fetchProduct = async (id: string): Promise<ProductDetail | null> => {
  const store = await cookies();
  const cookie = store.toString();
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      headers: cookie ? { cookie } : {},
      next: { revalidate: 15 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ProductDetail;
  } catch {
    return null;
  }
};

type Props = {
  params: Promise<{ id: string }>;
};

const ProductDetailContent = async ({ params }: Props) => {
  const { id } = await params;
  const p = await fetchProduct(id);
  if (!p) notFound();

  const pct = Math.min(100, Number(p.progress_pct) || 0);

  return (
    <main className="container">
      <div className="inv-detail-head">
        <div className="product-card-badges">
          <span className="badge">{TYPE_LABEL[p.type] ?? p.type}</span>
          <span
            className={`badge ${p.status === "recruiting" ? "badge-accent" : ""}`.trim()}
          >
            {STATUS_LABEL[p.status] ?? p.status}
          </span>
        </div>
        <h1>{p.name}</h1>
        <span className="inv-detail-no">상품번호 {p.product_no}</span>
        {p.tags && p.tags.length > 0 && (
          <div className="tag-row">
            {p.tags.map((t) => (
              <span key={t} className="badge">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <section className="card detail-summary">
        <div className="detail-kpis">
          <strong>{p.annual_rate}%</strong>
          <span>연수익률</span>
          <span>·</span>
          <span>{p.term_months}개월</span>
        </div>
        <div className="detail-progress-head">
          <span>진행률 {p.progress_pct}%</span>
          <RefreshButton />
        </div>
        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
        <dl className="kv">
          <dt>남은 금액</dt>
          <dd>{fmtWon(p.remaining_amount)}</dd>
          <dt>모집 금액</dt>
          <dd>{fmtWon(p.target_amount)}</dd>
          <dt>모집 시작</dt>
          <dd>{fmtDate(p.recruit_open_at)}</dd>
          <dt>상환 방식</dt>
          <dd>{REPAY_LABEL[p.repay_type] ?? p.repay_type}</dd>
          <dt>플랫폼 이용료</dt>
          <dd>연 {p.platform_fee_rate}%</dd>
          <dt>이자 지급일</dt>
          <dd>매월 {p.repay_day}일</dd>
        </dl>
      </section>

      <ProductActions product={p} />

      {p.my && (
        <section className="my-block">
          <p className="my-block-title">나의 투자 정보</p>
          <div className="my-block-row">
            <span>나의 예치금</span>
            <strong>{fmtWon(p.my.deposit)}</strong>
          </div>
          <div className="my-block-row">
            <span>투자 가능 금액</span>
            <strong>{fmtMan(p.my.investable)}</strong>
          </div>
          {p.my.grade_remaining_limit !== null && (
            <div className="my-block-row">
              <span>등급 잔여 한도</span>
              <strong>{fmtMan(p.my.grade_remaining_limit)}</strong>
            </div>
          )}
          {p.my.same_borrower_remaining !== null && (
            <div className="my-block-row">
              <span>동일 차입자 잔여 한도</span>
              <strong>{fmtMan(p.my.same_borrower_remaining)}</strong>
            </div>
          )}
          <div className="my-block-row">
            <span />
            <AppLink href="/mypage">충전하기</AppLink>
          </div>
        </section>
      )}

      <ProductTabs tabs={p.tabs} />
    </main>
  );
};

const ProductDetailPage = (props: Props) => (
  <Suspense fallback={null}>
    <ProductDetailContent {...props} />
  </Suspense>
);

export default ProductDetailPage;
