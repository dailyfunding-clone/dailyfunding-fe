import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";

import { API_URL } from "@/shared/api";

import { ProductBrowser } from "./_components";

import type { ProductListItem } from "./_components";
import "./investment.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "투자하기" };


const SERVER_PARAMS = [
  "type",
  "sort",
  "min_rate",
  "max_rate",
  "min_term",
  "max_term",
  "min_amount",
  "max_amount",
];

const fetchProducts = async (
  sp: Record<string, string | string[] | undefined>,
): Promise<ProductListItem[]> => {
  "use cache";
  cacheLife("products");
  cacheTag("products");
  const qs = new URLSearchParams();
  qs.set("include_closed", "1");
  qs.set("page_size", "100");
  for (const key of SERVER_PARAMS) {
    const v = sp[key];
    if (typeof v === "string" && v) qs.set(key, v);
  }
  try {
    const res = await fetch(`${API_URL}/products?${qs.toString()}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { results: ProductListItem[] };
    return data.results ?? [];
  } catch {
    return [];
  }
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const InvestmentContent = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  const products = await fetchProducts(sp);
  return <ProductBrowser products={products} />;
};

const InvestmentPage = (props: Props) => (
  <main className="container">
    <h1 className="page-title">투자하기</h1>
    <Suspense fallback={null}>
      <InvestmentContent {...props} />
    </Suspense>
  </main>
);

export default InvestmentPage;
