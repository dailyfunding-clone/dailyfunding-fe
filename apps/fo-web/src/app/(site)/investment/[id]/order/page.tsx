import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ReauthProvider } from "@/features/auth";
import { API_URL } from "@/shared/api";

import { OrderForm } from "../../_components";
import { ProductDetailSkeleton } from "../../_components";
import { TYPE_LABEL } from "../../_components";

import type { ProductDetail } from "../../_components";
import type { Metadata } from "next";
import "../../investment.scss";

export const metadata: Metadata = { title: "투자하기" };

const fetchProduct = async (id: string): Promise<ProductDetail | null> => {
  const res = await fetch(`${API_URL}/products/${id}`, {
    next: { revalidate: 15 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchProduct ${id} failed: ${res.status}`);
  }
  return (await res.json()) as ProductDetail;
};

type Props = {
  params: Promise<{ id: string }>;
};

const OrderContent = async ({ params }: Props) => {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();
  return (
    <main className="container">
      <h1 className="page-title">투자하기</h1>
      <div className="product-card-badges">
        <span className="badge">{TYPE_LABEL[product.type] ?? product.type}</span>
        <span className="badge">연 {product.annual_rate}%</span>
        <span className="badge">{product.term_months}개월</span>
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "10px 0 20px" }}>{product.name}</h2>
      <ReauthProvider
        title="투자 비밀번호 확인"
        description="투자하려면 비밀번호를 한 번 더 입력해 주세요."
      >
        <OrderForm product={product} />
      </ReauthProvider>
    </main>
  );
};

const OrderPage = (props: Props) => (
  <Suspense fallback={<ProductDetailSkeleton />}>
    <OrderContent {...props} />
  </Suspense>
);

export default OrderPage;
