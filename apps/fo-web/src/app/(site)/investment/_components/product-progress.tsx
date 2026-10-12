"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useEffect, useRef } from "react";

import { fmtMan } from "@/shared/api";

import { productProgressKey } from "./use-product-stream";

import type { ProductListItem } from "./types";
import type { ProductProgressData } from "./use-product-stream";

type Props = {
  product: ProductListItem;
};

const ProductProgress = memo(({ product }: Props) => {
  const queryClient = useQueryClient();
  const lastRaised = useRef(product.raised_amount);
  useEffect(() => {
    if (lastRaised.current === product.raised_amount) return;
    lastRaised.current = product.raised_amount;
    queryClient.setQueryData<ProductProgressData>(productProgressKey(product.id), (prev) => ({
      ...prev,
      raised_amount: product.raised_amount,
    }));
  }, [product.id, product.raised_amount, queryClient]);
  const live = useQuery<ProductProgressData>({
    queryKey: productProgressKey(product.id),
    enabled: false,
    staleTime: Infinity,
    initialData: { raised_amount: product.raised_amount },
  });
  const raised = live.data.raised_amount;
  const pct =
    product.target_amount > 0
      ? Math.min(100, (raised / product.target_amount) * 100)
      : Math.min(100, Number(product.progress_pct) || 0);
  return (
    <>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${product.name} 모집 진행률`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 10) / 10}
        aria-valuetext={`모집 달성률 ${pct.toFixed(1)}%`}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="product-card-meta">
        <span>{pct.toFixed(1)}%</span>
        <span>{fmtMan(product.target_amount)}</span>
      </div>
    </>
  );
});

ProductProgress.displayName = "ProductProgress";

export default ProductProgress;
