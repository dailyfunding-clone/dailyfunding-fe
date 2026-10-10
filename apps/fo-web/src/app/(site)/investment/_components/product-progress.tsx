"use client";

import { useQuery } from "@tanstack/react-query";
import { memo } from "react";

import { fmtMan } from "@/shared/api";

import { productProgressKey } from "./use-product-stream";

import type { ProductListItem } from "./types";
import type { ProductProgressData } from "./use-product-stream";

type Props = {
  product: ProductListItem;
};

const ProductProgress = memo(({ product }: Props) => {
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
      <div className="progress">
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
